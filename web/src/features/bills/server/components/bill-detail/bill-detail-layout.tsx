import { Container } from "@/components/layouts/container";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getPublicReportsByBillId } from "@/features/interview-report/server/loaders/get-public-reports-by-bill-id";
import { BillTopicsPreviewSection } from "@/features/user-topic-analysis/server/components/bill-topics-preview-section";
import { getPublicTopicAnalysis } from "@/features/user-topic-analysis/server/loaders/get-public-topic-analysis";
import { BillDetailClient } from "../../../client/components/bill-detail/bill-detail-client";
import { BillDisclaimer } from "../../../client/components/bill-detail/bill-disclaimer";
import { BillStatusProgress } from "../../../client/components/bill-detail/bill-status-progress";
import { MiraiStanceCard } from "../../../client/components/bill-detail/mirai-stance-card";
import { SupplementaryResolutionsSection } from "../../../client/components/bill-detail/supplementary-resolutions-section";
import type { BillWithContent } from "../../../shared/types";
import { getBillVideos } from "../../loaders/get-bill-videos";
import { getPublishedSupplementaryResolutions } from "../../loaders/get-published-supplementary-resolutions";
import { BillShareButtons } from "../share/bill-share-buttons";
import { BillContent } from "./bill-content";
import { BillDetailHeader } from "./bill-detail-header";
import { BillVideosSection } from "./bill-videos-section";

interface BillDetailLayoutProps {
  bill: BillWithContent;
  currentDifficulty: DifficultyLevelEnum;
}

export async function BillDetailLayout({
  bill,
  currentDifficulty,
}: BillDetailLayoutProps) {
  const [
    interviewConfig,
    publicReportsResult,
    topicAnalysis,
    videos,
    supplementaryResolutions,
  ] = await Promise.all([
    getInterviewConfig(bill.id),
    getPublicReportsByBillId(bill.id),
    getPublicTopicAnalysis(bill.id),
    getBillVideos(bill.id),
    getPublishedSupplementaryResolutions(bill.id),
  ]);

  // 法案提出前は賛否の中身（動画・附帯決議）を出さない
  const isStanceDisclosed = bill.status !== "preparing";

  return (
    <div className="container mx-auto pb-8 max-w-4xl">
      {/*
        テキスト選択機能とチャット連携の実装パターン:
        - BillContentはServer Componentのまま保持（SSRによる高速な初期レンダリング）
        - BillDetailClientでクライアントサイド機能（テキスト選択、チャット連携）を提供
        - このパターンによりSSRを保持しつつインタラクティブ機能を実装
      */}
      <BillDetailClient
        bill={bill}
        currentDifficulty={currentDifficulty}
        hasInterviewConfig={interviewConfig != null}
      >
        <BillDetailHeader
          bill={bill}
          hasInterviewConfig={interviewConfig != null}
          opinionCount={topicAnalysis?.total_opinions ?? 0}
          topicCount={topicAnalysis?.topics.length ?? 0}
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
      </BillDetailClient>

      <Container>
        {/* 法案のトピック一覧（AIインタビュー意見の整理） */}
        <div className="my-8">
          <BillTopicsPreviewSection
            billId={bill.id}
            topics={topicAnalysis?.topics ?? []}
            publicReportCount={publicReportsResult.totalCount}
          />
        </div>

        {interviewConfig != null && (
          <div className="my-8">
            <InterviewLandingSection billId={bill.id} />
          </div>
        )}
        {/*
          賛否が未設定・非公開（公開日時前を含む）なら出さない。法案提出前でも、
          賛否を登録していない段階で「法案提出前」のカードだけを出すことはしない。
        */}
        {bill.mirai_stance && (
          <>
            {/*
              動画と附帯決議（院ごとの公開確認を経たもの）は賛否の判断に関する内容なので、
              賛否が公開されていない間・法案提出前は出さない。
              動画は賛否カードの中、附帯決議はその次の独立したセクションに置く。
            */}
            <div className="my-8">
              <MiraiStanceCard
                stance={bill.mirai_stance}
                billStatus={bill.status}
              >
                {isStanceDisclosed && videos.length > 0 && (
                  <BillVideosSection videos={videos} />
                )}
              </MiraiStanceCard>
            </div>
            {isStanceDisclosed && supplementaryResolutions.length > 0 && (
              <div className="my-8">
                <SupplementaryResolutionsSection
                  resolutions={supplementaryResolutions}
                />
              </div>
            )}
          </>
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
