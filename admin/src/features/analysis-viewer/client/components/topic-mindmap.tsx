"use client";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OpinionCard } from "../../shared/components/opinion-card";
import type { ViewerBigTopic } from "../../shared/types";
import {
  buildMindmapGraph,
  findMediumTopic,
  MINDMAP_NODE_SIZE,
  type MindmapNodeData,
  resolveSelectedNodeId,
} from "../../shared/utils/build-mindmap-graph";

type TopicNode = Node<MindmapNodeData, "topic">;

/**
 * 論点マップ。大トピック → 中トピックを節点と枝で描く。
 *
 * プロトタイプに合わせて React Flow + dagre（左から右）で組む。意見はノードに
 * せず、中トピックを選んだときに脇のパネルに出す。300件を超える意見をノードに
 * すると、一望して論点を掴むという目的が崩れるため。
 *
 * fitView を効かせるために ReactFlowProvider が必要なので、ここで包んでいる。
 */
export function TopicMindmap({
  bigTopics,
  billName,
}: {
  bigTopics: ViewerBigTopic[];
  billName: string;
}) {
  if (bigTopics.length === 0) {
    return (
      <p className="rounded border bg-white p-6 text-sm text-gray-500">
        この絞り込みに該当する意見がありません。
      </p>
    );
  }

  return (
    <ReactFlowProvider>
      <MindmapCanvas bigTopics={bigTopics} billName={billName} />
    </ReactFlowProvider>
  );
}

function MindmapCanvas({
  bigTopics,
  billName,
}: {
  bigTopics: ViewerBigTopic[];
  billName: string;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const graph = useMemo(
    () => buildMindmapGraph(bigTopics, billName),
    [bigTopics, billName]
  );
  const selected = useMemo(
    () => findMediumTopic(bigTopics, selectedNodeId),
    [bigTopics, selectedNodeId]
  );

  // React Flow は変更ハンドラを受け取らないとノードの実寸を確定できない。
  // 絞り込みの切り替えでは親が key を変えて作り直すので、初期値だけ渡せば足りる。
  const [nodes, , onNodesChange] = useNodesState<TopicNode>(graph.nodes);
  const [edges, , onEdgesChange] = useEdgesState(graph.edges);

  // マウント時の fitView は測定の完了前に走ることがあり、1ノードに合わせた
  // ズームで止まる。測定完了を待って明示的に合わせ直す。
  //
  // minZoom で下限を切るのは、全体を収めると文字が読めなくなるため。中トピックが
  // 30件あるとグラフ高は4000pxを超え、収めるズームは0.1倍を下回る。初期表示は
  // 読める大きさに留め、全体の把握はミニマップ、移動はパンとズームに任せる。
  // クリックだけを見るとキーボード操作（ノードにフォーカスして Enter / Space）で
  // 選択したときにパネルが変わらない。React Flow の選択状態を唯一の入力にする。
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: TopicNode[] }) => {
      setSelectedNodeId(resolveSelectedNodeId(selectedNodes));
    },
    []
  );

  const nodesInitialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodesInitialized) fitView({ padding: 0.1, minZoom: 0.55 });
  }, [nodesInitialized, fitView]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="h-[calc(100vh-19rem)] min-h-[560px] flex-1 rounded border bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={{ type: "smoothstep" }}
          onSelectionChange={handleSelectionChange}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          // 11大トピック×30中トピックを1画面に収めるには既定の下限では足りない。
          minZoom={0.05}
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      <aside className="lg:w-[420px] lg:shrink-0">
        {selected ? (
          <>
            <p className="mb-1 text-xs text-gray-500">
              {selected.bigTopic.title}
            </p>
            <h2 className="mb-1 text-sm font-semibold">
              {selected.mediumTopic.title}
            </h2>
            <p className="mb-3 whitespace-pre-wrap text-xs text-gray-600">
              {selected.mediumTopic.description}
            </p>
            <p className="mb-2 text-xs text-gray-500">
              {selected.mediumTopic.opinions.length}件
            </p>
            <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {selected.mediumTopic.opinions.map((opinion) => (
                <OpinionCard key={opinion.id} opinion={opinion} />
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded border bg-white p-6 text-sm text-gray-500">
            中トピックを選ぶと、その論点に紐づく意見を表示する。
          </p>
        )}
      </aside>
    </div>
  );
}

function TopicNodeView({ data, selected }: NodeProps<TopicNode>) {
  const isRoot = data.kind === "root";
  const filled = data.kind !== "medium";
  const size = MINDMAP_NODE_SIZE[data.kind];

  return (
    <div
      style={{ width: size.width, height: size.height }}
      className={[
        "overflow-hidden rounded px-3 py-2 text-left",
        // admin のトークンはグレースケール。根と大トピックを primary の黒で塗り、
        // 根は枠線で見分ける（web の primary-accent / mirai-text は admin に無い）。
        filled ? "bg-primary text-primary-foreground" : "border bg-card",
        isRoot ? "border-2 border-ring" : "",
        selected ? "ring-2 ring-ring" : "",
      ].join(" ")}
    >
      {!isRoot && <Handle type="target" position={Position.Left} />}
      <p
        className={[
          "line-clamp-2 text-xs font-semibold",
          filled ? "" : "text-card-foreground",
        ].join(" ")}
      >
        {data.title}
      </p>
      <p
        className={[
          "mt-1 text-[10px]",
          filled ? "text-primary-foreground/80" : "text-muted-foreground",
        ].join(" ")}
      >
        {data.opinionCount}件
      </p>
      <p
        className={[
          "mt-1 line-clamp-2 text-[10px]",
          filled ? "text-primary-foreground/80" : "text-muted-foreground",
        ].join(" ")}
      >
        {data.description}
      </p>
      {data.kind !== "medium" && (
        <Handle type="source" position={Position.Right} />
      )}
    </div>
  );
}

// ReactFlow は nodeTypes の同一性で再マウントを判断するため、外に固定する。
const NODE_TYPES = { topic: TopicNodeView };
