import "server-only";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBillWithContents } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
import { routes } from "@/lib/routes";
import { SimulationForm } from "../../client/components/simulation-form";
import { getBillConfigsWithPrompts } from "../loaders/get-bill-configs-with-prompts";
import { getReportDetailForSimulation } from "../loaders/get-report-detail-for-simulation";

interface SimulationRunPageProps {
  billId: string;
  configId: string;
  reportId: string | null;
}

export async function SimulationRunPage({
  billId,
  configId,
  reportId,
}: SimulationRunPageProps) {
  if (!reportId) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link
            href={routes.billInterviewSimulation(billId, configId) as Route}
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            シミュレーション一覧に戻る
          </Link>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          reportId が指定されていません。レポート一覧から選択してください。
        </div>
      </div>
    );
  }

  const [detail, availableConfigs] = await Promise.all([
    getReportDetailForSimulation(reportId),
    getBillConfigsWithPrompts(billId),
  ]);

  if (!detail) {
    notFound();
  }

  // billId と detail.snapshot.billId が一致するかは厳密に検証しない
  // (URL を直接編集して別 bill のレポートを開く可能性は低く、開いたとしても表示は問題なく成立する)
  const billData = await fetchBillWithContents(billId);

  const currentConfig = availableConfigs.find(
    (c) => c.id === detail.snapshot.configId
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link
            href={routes.billInterviewSimulation(billId, configId) as Route}
            className="flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            シミュレーション一覧に戻る
          </Link>
        </div>
        <h1 className="text-2xl font-bold">{billData.bill.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          現行 config: {currentConfig?.name ?? "不明"} (mode: {detail.mode} /
          質問数: {detail.questions.length})
        </p>
      </div>

      <SimulationForm
        original={detail.snapshot}
        currentConfigId={detail.snapshot.configId}
        currentConfigName={currentConfig?.name ?? "不明な config"}
        currentConfigMode={detail.mode}
        currentQuestionsCount={detail.questions.length}
        currentDefaultSystemPrompt={
          currentConfig?.defaultSystemPrompt ??
          availableConfigs[0]?.defaultSystemPrompt ??
          ""
        }
        availableConfigs={availableConfigs}
      />
    </div>
  );
}
