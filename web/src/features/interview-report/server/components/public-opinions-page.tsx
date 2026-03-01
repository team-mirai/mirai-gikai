import "server-only";

import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getReportReactionsBatch } from "@/features/report-reaction/server/loaders/get-report-reactions";
import { PublicOpinionsList } from "../../client/components/public-opinions-list";
import { getAllPublicReportsByBillId } from "../loaders/get-all-public-reports-by-bill-id";

interface PublicOpinionsPageProps {
  billId: string;
}

export async function PublicOpinionsPage({ billId }: PublicOpinionsPageProps) {
  const [bill, reports, interviewConfig] = await Promise.all([
    getBillById(billId),
    getAllPublicReportsByBillId(billId),
    getInterviewConfig(billId),
  ]);

  if (!bill) {
    notFound();
  }

  const billTitle = bill.bill_content?.title || bill.name;

  const reportIds = reports.map((r) => r.id);
  const reactionsMap = await getReportReactionsBatch(reportIds);
  const reactionsRecord: Record<
    string,
    { counts: { helpful: number; hmm: number }; userReaction: string | null }
  > = {};
  for (const [id, data] of reactionsMap) {
    reactionsRecord[id] = {
      counts: data.counts,
      userReaction: data.userReaction,
    };
  }

  return (
    <div className="min-h-dvh bg-mirai-surface">
      {/* ヒーロー画像 */}
      {bill.thumbnail_url && (
        <div className="relative w-full h-[285px]">
          <Image
            src={bill.thumbnail_url}
            alt={billTitle}
            fill
            className="object-cover"
          />
        </div>
      )}

      <Container>
        {/* 法案タイトル */}
        <div className="py-6">
          <h1 className="text-2xl font-bold leading-[1.5] text-black">
            {billTitle}
          </h1>
          {bill.name !== billTitle && (
            <p className="mt-2 text-xs font-medium leading-[1.67] text-mirai-text-muted">
              {bill.name}
            </p>
          )}
        </div>

        {/* 意見一覧（フィルター付き） */}
        <PublicOpinionsList
          reports={reports}
          reactionsRecord={reactionsRecord}
        />

        {/* AIインタビューCTAバナー */}
        {interviewConfig != null && (
          <div className="my-8">
            <InterviewLandingSection
              billId={billId}
              estimatedDuration={interviewConfig.estimated_duration}
            />
          </div>
        )}
      </Container>
    </div>
  );
}
