import "server-only";

import { ArrowLeft, Play } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { findInterviewConfigById } from "@/features/interview-config/server/repositories/interview-config-repository";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import { fetchBillWithContents } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
import { routes } from "@/lib/routes";
import { getCompletedReportList } from "../loaders/get-completed-report-list";

interface SimulationListPageProps {
  billId: string;
  configId: string;
}

export async function SimulationListPage({
  billId,
  configId,
}: SimulationListPageProps) {
  const interviewConfig = await findInterviewConfigById(configId);
  if (!interviewConfig) {
    notFound();
  }

  const [billData, reports] = await Promise.all([
    fetchBillWithContents(billId),
    getCompletedReportList(configId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link
            href={routes.billInterview(billId) as Route}
            className="flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            インタビュー設定に戻る
          </Link>
        </div>
        <h1 className="text-2xl font-bold">{billData.bill.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          シミュレーション対象設定: {interviewConfig.name}（mode:{" "}
          {interviewConfig.mode}）
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
        <p className="font-medium mb-1">インタビューシミュレーションとは</p>
        <p className="text-muted-foreground">
          過去の完了レポートを 1 件選び、AI
          でそのインタビュイーのペルソナを再現し、
          現行プロンプトと改善版プロンプトの両方でインタビューを再演します。 AI
          Judge が両者を比較評価するので、プロンプト改善案を本番投入する前に
          素早く効果検証できます。
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          完了済みのインタビューレポートがありません。
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">
                  立場
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium">
                  スタンス
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium">
                  サマリ
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium">
                  情報量
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium">
                  完了日時
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((r) => {
                const runHref = `${routes.billInterviewSimulationRun(
                  billId,
                  configId
                )}?reportId=${r.reportId}`;
                return (
                  <tr key={r.reportId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      {r.roleTitle ?? (
                        <span className="text-muted-foreground">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StanceBadge stance={r.stance} />
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md">
                      <span className="line-clamp-2 text-muted-foreground">
                        {r.summary ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {r.totalContentRichness ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {r.completedAt
                        ? new Date(r.completedAt).toLocaleString("ja-JP")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button asChild size="sm" variant="default">
                        <Link href={runHref as Route}>
                          <Play className="h-3.5 w-3.5" />
                          シミュレートする
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
