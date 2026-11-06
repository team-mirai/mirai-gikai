import "server-only";

import {
  OPINION_AUDIENCE_LABELS,
  OPINION_AUDIENCES,
} from "@mirai-gikai/shared/interview-report/opinion-tags";
import { fetchBillContext } from "@mirai-gikai/topic-analysis-core/repository";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { TopicMindmap } from "../../client/components/topic-mindmap";
import { OpinionCard } from "../../shared/components/opinion-card";
import {
  buildViewerHierarchy,
  flattenOpinions,
} from "../../shared/utils/build-viewer-hierarchy";
import {
  collectConcerns,
  collectGroundedOpinions,
  collectProposals,
  type FlatOpinion,
  searchOpinions,
} from "../../shared/utils/collect-opinion-lists";
import {
  buildViewerQuery,
  parseViewerParams,
  VIEWER_VIEW_LABELS,
  VIEWER_VIEWS,
  type ViewerParams,
  type ViewerSearchParams,
} from "../../shared/utils/parse-viewer-params";
import { getAnalysisForViewer } from "../loaders/get-analysis-for-viewer";
import { SearchForm } from "./search-form";

export async function AnalysisViewerPage({
  billId,
  searchParams,
}: {
  billId: string;
  searchParams: ViewerSearchParams;
}) {
  const params = parseViewerParams(searchParams);
  const [bill, analysis] = await Promise.all([
    fetchBillContext(billId),
    getAnalysisForViewer(billId),
  ]);

  const basePath = routes.billAnalysisViewer(billId);

  if (!analysis) {
    return (
      <div className="container mx-auto py-8">
        <Header billName={bill.name} />
        <p className="rounded border bg-white p-6 text-sm text-gray-500">
          完了したトピック分析がまだありません。
        </p>
      </div>
    );
  }

  const bigTopics = buildViewerHierarchy(analysis.topics, params.audience);
  const totalOpinions = flattenOpinions(bigTopics).length;

  return (
    <div className="container mx-auto py-8">
      <Header billName={bill.name} />

      <p className="mb-4 text-sm text-gray-500">
        v{analysis.version} ・ 大トピック{bigTopics.length}件 ・ 意見
        {totalOpinions}件{params.audience !== "all" && "（絞り込み後）"}
      </p>

      <nav aria-label="分析対象" className="mb-3 flex flex-wrap gap-1">
        {OPINION_AUDIENCES.map((audience) => (
          <TabLink
            key={audience}
            href={`${basePath}${buildViewerQuery(params, { audience })}`}
            active={params.audience === audience}
            label={OPINION_AUDIENCE_LABELS[audience]}
          />
        ))}
      </nav>

      <nav aria-label="表示切替" className="mb-6 flex flex-wrap gap-1">
        {VIEWER_VIEWS.map((view) => (
          <TabLink
            key={view}
            href={`${basePath}${buildViewerQuery(params, { view })}`}
            active={params.view === view}
            label={VIEWER_VIEW_LABELS[view]}
          />
        ))}
      </nav>

      {params.view === "topics" && (
        // audience を切り替えると大トピックの構成が変わる。key を変えて
        // 選択状態を持ち越さない（消えた中トピックを選んだままにしない）。
        <TopicMindmap
          key={params.audience}
          bigTopics={bigTopics}
          billName={bill.name}
        />
      )}
      {params.view === "concerns" && (
        <OpinionList
          opinions={collectConcerns(bigTopics)}
          emptyMessage="懸念として抽出された意見がありません。"
        />
      )}
      {params.view === "proposals" && (
        <OpinionList
          opinions={collectProposals(bigTopics)}
          emptyMessage="提案として抽出された意見がありません。"
        />
      )}
      {params.view === "grounded" && (
        <OpinionList
          opinions={collectGroundedOpinions(bigTopics)}
          emptyMessage="専門知識・研究引用・海外事例を根拠にした意見がありません。"
        />
      )}
      {params.view === "search" && (
        <SearchView bigTopics={bigTopics} params={params} basePath={basePath} />
      )}
    </div>
  );
}

function Header({ billName }: { billName: string }) {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">意見分析ビューア</h1>
      <p className="mb-1 text-sm text-gray-600">議案: {billName}</p>
      <p className="mb-4 text-sm text-gray-500">
        公開に同意された意見をもとに、論点を大トピック・中トピックの2階層で見る。
        絞り込みの「専門家」は肩書ではなく、発言が専門知識を根拠にしているかで判定する。
      </p>
    </>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href as Route}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
          : "rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      }
    >
      {label}
    </Link>
  );
}

function OpinionList({
  opinions,
  emptyMessage,
}: {
  opinions: FlatOpinion[];
  emptyMessage: string;
}) {
  if (opinions.length === 0) {
    return (
      <p className="rounded border bg-white p-6 text-sm text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <p className="mb-2 text-sm text-gray-500">{opinions.length}件</p>
      <ul className="flex flex-col gap-2">
        {opinions.map((opinion) => (
          <OpinionCard
            key={opinion.id}
            opinion={opinion}
            topicPath={`${opinion.bigTopicTitle} › ${opinion.mediumTopicTitle}`}
          />
        ))}
      </ul>
    </>
  );
}

function SearchView({
  bigTopics,
  params,
  basePath,
}: {
  bigTopics: ReturnType<typeof buildViewerHierarchy>;
  params: ViewerParams;
  basePath: string;
}) {
  const results = searchOpinions(bigTopics, params.query);

  return (
    <>
      <SearchForm
        action={basePath}
        audience={params.audience}
        defaultValue={params.query}
      />
      {params.query ? (
        <OpinionList
          opinions={results}
          emptyMessage={`「${params.query}」に一致する意見がありません。`}
        />
      ) : (
        <p className="rounded border bg-white p-6 text-sm text-gray-500">
          意見のタイトル・本文・引用・懸念・提案・トピック名を横断して検索する。
        </p>
      )}
    </>
  );
}
