import dagre from "@dagrejs/dagre";
import type { ViewerBigTopic } from "../types";

/**
 * マインドマップのノード。大トピックと中トピックだけを置き、意見は置かない。
 * 意見まで並べると一望性が失われる（1議案で300件を超える）ため、
 * 中トピックを選んだときに脇に出す。
 */
export type MindmapNodeData = {
  kind: "root" | "big" | "medium";
  title: string;
  description: string | null;
  opinionCount: number;
  /** 中トピックのとき、意見を引くための元 id。それ以外は null。 */
  mediumTopicId: string | null;
};

export type MindmapNode = {
  id: string;
  position: { x: number; y: number };
  data: MindmapNodeData;
  type: "topic";
  /**
   * React Flow に測定前の寸法として渡す。
   * これが無いと初回の fitView が実寸を知らずに走り、1ノードだけ拡大した状態で
   * 止まる（11大トピックが画面に収まらない）。
   */
  width: number;
  height: number;
};

export type MindmapEdge = {
  id: string;
  source: string;
  target: string;
};

export type MindmapGraph = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};

/**
 * dagre に渡すノードの寸法。実測ではなく固定値を使う。
 *
 * 実 DOM を測ってから並べ直すと、レイアウトが描画タイミングに依存して
 * 非決定になり、テストも書けない。幅を固定して折り返す方が扱いやすい。
 */
export const MINDMAP_NODE_SIZE = {
  root: { width: 240, height: 72 },
  big: { width: 260, height: 88 },
  medium: { width: 300, height: 96 },
} as const;

/** 根ノードの id。議案そのものを表す。 */
export const MINDMAP_ROOT_ID = "root";

/** プロトタイプと同じレイアウト設定。左から右に伸ばす。 */
const DAGRE_CONFIG = {
  rankdir: "LR",
  nodesep: 50,
  edgesep: 20,
  ranksep: 90,
} as const;

/**
 * dagre に渡す寸法は**必ずノードごとの新しいオブジェクトにする。**
 *
 * dagre はノードのラベルオブジェクトに x / y / rank を直接書き込むため、
 * MINDMAP_NODE_SIZE を共有すると全ノードが同じラベルを指し、最後の書き込みで
 * 座標が上書きされて全部同じ位置に重なる。
 */
function nodeSize(kind: keyof typeof MINDMAP_NODE_SIZE) {
  return { ...MINDMAP_NODE_SIZE[kind] };
}

/**
 * 階層からマインドマップのノードとエッジを組み立てる純粋関数。
 *
 * 議案そのものを根ノードに置き、そこから大トピックを生やす。マインドマップは
 * 中心から放射する図なので、議案を中心に据えるのがプロトタイプと同じ形になる。
 * レイアウト上の必要はない（dagre は非連結成分も縦に分離できる）。
 *
 * dagre は同じ入力に対して同じ座標を返すので、位置まで含めてテストできる。
 * 座標はノードの中心を返すため、React Flow が期待する左上原点に直してから返す。
 */
export function buildMindmapGraph(
  bigTopics: readonly ViewerBigTopic[],
  billName: string
): MindmapGraph {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph(DAGRE_CONFIG);
  graph.setDefaultEdgeLabel(() => ({}));

  const nodes: Omit<MindmapNode, "position" | "width" | "height">[] = [];
  const edges: MindmapEdge[] = [];

  if (bigTopics.length === 0) return { nodes: [], edges: [] };

  nodes.push({
    id: MINDMAP_ROOT_ID,
    type: "topic",
    data: {
      kind: "root",
      title: billName,
      description: null,
      opinionCount: bigTopics.reduce(
        (sum, topic) => sum + topic.opinionCount,
        0
      ),
      mediumTopicId: null,
    },
  });
  graph.setNode(MINDMAP_ROOT_ID, nodeSize("root"));

  for (const bigTopic of bigTopics) {
    const bigId = `big:${bigTopic.id}`;
    nodes.push({
      id: bigId,
      type: "topic",
      data: {
        kind: "big",
        title: bigTopic.title,
        description: bigTopic.description,
        opinionCount: bigTopic.opinionCount,
        mediumTopicId: null,
      },
    });
    graph.setNode(bigId, nodeSize("big"));
    graph.setEdge(MINDMAP_ROOT_ID, bigId);
    edges.push({
      id: `${MINDMAP_ROOT_ID}->${bigId}`,
      source: MINDMAP_ROOT_ID,
      target: bigId,
    });

    for (const mediumTopic of bigTopic.mediumTopics) {
      // 中トピックの id は version 内で一意だが、大トピック側と衝突しないよう
      // 接頭辞を付ける（未分類の大トピックは合成 id を使うため）。
      const mediumId = `medium:${bigTopic.id}:${mediumTopic.id}`;
      nodes.push({
        id: mediumId,
        type: "topic",
        data: {
          kind: "medium",
          title: mediumTopic.title,
          description: mediumTopic.description,
          opinionCount: mediumTopic.opinions.length,
          mediumTopicId: mediumTopic.id,
        },
      });
      graph.setNode(mediumId, nodeSize("medium"));
      graph.setEdge(bigId, mediumId);
      edges.push({
        id: `${bigId}->${mediumId}`,
        source: bigId,
        target: mediumId,
      });
    }
  }

  dagre.layout(graph);

  return {
    nodes: nodes.map((node) => {
      const size = MINDMAP_NODE_SIZE[node.data.kind];
      const laidOut = graph.node(node.id);
      return {
        ...node,
        width: size.width,
        height: size.height,
        position: {
          x: laidOut.x - size.width / 2,
          y: laidOut.y - size.height / 2,
        },
      };
    }),
    edges,
  };
}

/**
 * React Flow の選択状態から、意見パネルが見るノード id を決める純粋関数。
 *
 * クリックだけでなくキーボード（ノードにフォーカスして Enter / Space）でも
 * 選択が変わるため、パネルはクリックイベントではなく選択状態を見る。
 * 複数選択は使わないので先頭だけを採る。
 */
export function resolveSelectedNodeId(
  selectedNodes: readonly { id: string }[]
): string | null {
  return selectedNodes[0]?.id ?? null;
}

/** ノード id から中トピックを引く。選択中のノードの意見を出すのに使う。 */
export function findMediumTopic(
  bigTopics: readonly ViewerBigTopic[],
  nodeId: string | null
) {
  if (!nodeId?.startsWith("medium:")) return null;
  for (const bigTopic of bigTopics) {
    for (const mediumTopic of bigTopic.mediumTopics) {
      if (nodeId === `medium:${bigTopic.id}:${mediumTopic.id}`) {
        return { bigTopic, mediumTopic };
      }
    }
  }
  return null;
}
