import { Container } from "@/components/layouts/container";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { BillInterviewOpinionsSection } from "@/features/interview-report/server/components/bill-interview-opinions-section";
import { getPublicReportsByBillId } from "@/features/interview-report/server/loaders/get-public-reports-by-bill-id";
import { BillDisclaimer } from "../../../client/components/bill-detail/bill-disclaimer";
import { BillStatusProgress } from "../../../client/components/bill-detail/bill-status-progress";
import { MiraiStanceCard } from "../../../client/components/bill-detail/mirai-stance-card";
import type { BillWithContent } from "../../../shared/types";
import { BillShareButtons } from "../share/bill-share-buttons";
import { BillContent } from "./bill-content";
import { BillDetailHeader } from "./bill-detail-header";

interface BillDetailLayoutProps {
  bill: BillWithContent;
}

export async function BillDetailLayout({ bill }: BillDetailLayoutProps) {
  const showMiraiStance = bill.status === "preparing" || bill.mirai_stance;
  const [interviewConfig, publicReportsResult] = await Promise.all([
    getInterviewConfig(bill.id),
    getPublicReportsByBillId(bill.id),
  ]);

  return (
    <div className="container mx-auto pb-8 max-w-4xl">
      <BillDetailHeader
        bill={bill}
        hasInterviewConfig={interviewConfig != null}
        opinionCount={publicReportsResult.totalCount}
      />
      <Container>
        {/* 議案ステータス進捗 */}
        <div className="my-8">
          <BillStatusProgress
            status={bill.status}
            originatingHouse={bill.originating_house}
            statusNote={bill.status_note}
          />
        </div>

        <BillContent bill={bill} />
      </Container>

      <Container>
        {publicReportsResult.totalCount > 0 && (
          <div className="my-8">
            <BillInterviewOpinionsSection
              billId={bill.id}
              reports={publicReportsResult.reports}
              totalCount={publicReportsResult.totalCount}
            />
          </div>
        )}
        {interviewConfig != null && (
          <div className="my-8">
            <InterviewLandingSection billId={bill.id} />
          </div>
        )}
        {showMiraiStance && (
          <div className="my-8">
            <MiraiStanceCard
              stance={bill.mirai_stance}
              billStatus={bill.status}
            />
          </div>
        )}
        {/* シェアボタン */}
        <div className="my-8">
          <BillShareButtons bill={bill} />
        </div>

        {/* データの出典と免責事項 */}
        <div className="my-8">
          <BillDisclaimer />
        </div>
      </Container>
    </div>
  );
}
