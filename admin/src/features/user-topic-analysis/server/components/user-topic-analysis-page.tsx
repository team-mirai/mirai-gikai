import "server-only";

import {
  fetchBillContext,
  getTopicsWithOpinions,
  listVersionsByBill,
} from "@mirai-gikai/topic-analysis-core/repository";
import { RunAnalysisButton } from "../../client/components/run-analysis-button";

const STATUS_LABEL: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "失敗",
};

export async function UserTopicAnalysisPage({ billId }: { billId: string }) {
  const [bill, versions] = await Promise.all([
    fetchBillContext(billId),
    listVersionsByBill(billId),
  ]);

  const latestCompleted = versions.find((v) => v.status === "completed");
  const topics = latestCompleted
    ? await getTopicsWithOpinions(latestCompleted.id)
    : [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-1 text-2xl font-bold">ユーザー向けトピック分析</h1>
      <p className="mb-1 text-sm text-gray-600">議案: {bill.name}</p>
      <p className="mb-6 text-sm text-gray-500">
        公開に同意された意見（モデレーションOK）のみを対象に、論点（トピック）を抽出・分類します。
      </p>

      <section className="mb-8 rounded-lg border bg-white p-6">
        <RunAnalysisButton billId={billId} />
      </section>

      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold">バージョン履歴</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-gray-500">
            まだ分析が実行されていません。
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">version</th>
                <th className="py-2">状態</th>
                <th className="py-2">対象意見数</th>
                <th className="py-2">作成</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="py-2 tabular-nums">v{v.version}</td>
                  <td className="py-2">
                    {STATUS_LABEL[v.status] ?? v.status}
                    {v.status === "running" && v.current_step
                      ? `（${v.current_step}）`
                      : ""}
                  </td>
                  <td className="py-2 tabular-nums">
                    {v.source_opinion_count ?? "-"}
                  </td>
                  <td className="py-2 text-gray-500">
                    {new Date(v.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {latestCompleted && (
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold">
            最新の分析結果（v{latestCompleted.version}・トピック {topics.length}
            件）
          </h2>
          {topics.length === 0 ? (
            <p className="text-sm text-gray-500">
              トピックがありません（対象意見が少ない可能性があります）。
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {topics.map((topic) => {
                const opinions = (topic.topic_opinion ?? [])
                  .map((to) => to.interview_opinion)
                  .filter((o): o is NonNullable<typeof o> => o != null);
                return (
                  <li key={topic.id} className="rounded border p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold">{topic.title}</h3>
                      <span className="shrink-0 text-sm text-gray-500">
                        {opinions.length}件
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {topic.description}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
                      {opinions.slice(0, 3).map((o) => (
                        <li key={o.id} className="border-l-2 pl-2">
                          {o.contextual_quote ?? o.title}
                          {o.bill_sentiment ? `（${o.bill_sentiment}）` : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
