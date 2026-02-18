import { ArrowRight, Undo2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BillWithContent } from "@/features/bills/shared/types";
import { InterviewStatusBadge } from "@/features/interview-session/client/components/interview-status-badge";
import type { LatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import type { InterviewConfig } from "../../server/loaders/get-interview-config";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { InterviewActionButtons } from "./interview-action-buttons";

interface InterviewLPPageProps {
  bill: BillWithContent;
  interviewConfig: InterviewConfig;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
}

const FEATURES = [
  {
    icon: "/icons/interview-icon-1.svg",
    iconWidth: 20,
    text: "AIがあなたの課題感や\nご経験をお聞きします",
  },
  {
    icon: "/icons/interview-icon-2.svg",
    iconWidth: 16,
    text: "ご意見はチームみらいの\n政策検討に活かします",
  },
  {
    icon: "/icons/interview-icon-3.svg",
    iconWidth: 24,
    text: "あなたの声がチームみらいを通じて国会に届けられる可能性があります",
  },
] as const;

function _InterviewLPHeader({ bill }: { bill: BillWithContent }) {
  return (
    <div className="relative w-full h-72 md:h-80">
      {bill.thumbnail_url ? (
        <Image
          src={bill.thumbnail_url}
          alt={bill.bill_content?.title ?? bill.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      ) : (
        <div className="w-full h-full bg-gray-100" />
      )}
    </div>
  );
}

function _InterviewLPHero({
  bill,
  billId,
  sessionInfo,
  previewToken,
}: {
  bill: BillWithContent;
  billId: string;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
}) {
  const billLink = getBillDetailLink(billId, previewToken);

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center justify-center gap-2 px-6 py-2 mb-3 bg-primary rounded-2xl">
          <span className="text-[15px] font-medium text-white leading-tight">
            法案の当事者の方へ
          </span>
        </div>
        <h1 className="text-2xl font-bold text-center leading-[1.5]">
          法案についてのAIインタビュー
        </h1>
        <Link href={billLink}>
          <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white rounded-xl hover:bg-gray-50 transition-opacity cursor-pointer">
            <span className="text-[15px] font-bold text-black leading-[1.87]">
              {bill.bill_content?.title ?? bill.name}
            </span>
          </div>
        </Link>
        {sessionInfo && <InterviewStatusBadge status={sessionInfo.status} />}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[334px] pl-4">
        {FEATURES.map((feature) => (
          <div key={feature.text} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-[54px] h-[54px] bg-white rounded-[30px] flex items-center justify-center">
              <Image
                src={feature.icon}
                alt=""
                width={feature.iconWidth}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="text-[15px] font-medium text-black leading-[1.73] whitespace-pre-line">
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-[370px] mt-2 flex flex-col gap-3">
        <InterviewActionButtons
          billId={billId}
          sessionInfo={sessionInfo}
          previewToken={previewToken}
        />
      </div>
    </div>
  );
}

function _InterviewOverviewSection({
  billId,
  billName,
  previewToken,
}: {
  billId: string;
  billName: string;
  previewToken?: string;
}) {
  const billLink = getBillDetailLink(billId, previewToken);

  return (
    <div className="w-full max-w-[370px] mx-auto bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        インタビュー概要
      </h2>
      <div className="space-y-4 text-[15px] font-normal text-black leading-[1.87]">
        <p>
          国会で検討されている
          <Link
            href={billLink}
            className="text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {billName}
          </Link>
          について、AIがあなたの考えを深堀りするチャット型インタビューです
        </p>
        <p>
          いただいたご意見は、政策研究や国会での審議に活用し、みらい議会上に公開される可能性があります。
        </p>
      </div>
      <div>
        <Link href={billLink}>
          <Button
            variant="outline"
            className="w-full border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4"
          >
            <span>法案詳細はこちら</span>
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function _InterviewDurationSection() {
  return (
    <div className="w-full max-w-[370px] mx-auto bg-white rounded-2xl p-6 space-y-2">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        予定時間
      </h2>
      <p className="text-[22px] font-bold text-[#0F8472] leading-[1.64]">
        約5分〜
      </p>
    </div>
  );
}

function _InterviewThemesSection({
  themes,
}: {
  themes: string[] | null | undefined;
}) {
  if (!themes || themes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[370px] mx-auto bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        質問テーマ
      </h2>
      <div className="flex flex-col gap-3">
        {themes.map((theme) => (
          <div key={theme} className="flex gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
              <Image
                src="/icons/check-icon.svg"
                alt=""
                width={24}
                height={24}
                className="object-contain mt-2"
              />
            </div>
            <span className="text-[15px] font-normal text-black leading-[1.87]">
              {theme}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function _InterviewNoticeSection() {
  return (
    <div className="w-full max-w-[370px] mx-auto bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        注意事項
      </h2>
      <div className="space-y-3 text-[13px] font-normal text-black leading-[1.69]">
        <p>
          このインタビューはAIが対話形式で実施します。
          リラックスして、ご自身の考えや経験をお聞かせください。
        </p>
        <p>
          インタビューログは公開される可能性があるため、個人情報や機密情報などセンシティブな内容については記載しないようにしてください。
        </p>
      </div>
    </div>
  );
}

function _InterviewFooterActions({
  billId,
  sessionInfo,
  previewToken,
}: {
  billId: string;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
}) {
  const billLink = getBillDetailLink(billId, previewToken);

  return (
    <div className="flex flex-col w-full max-w-[370px] mx-auto space-y-4">
      <InterviewActionButtons
        billId={billId}
        sessionInfo={sessionInfo}
        previewToken={previewToken}
      />
      <Link href={billLink}>
        <Button variant="outline" className="w-full">
          <Undo2 className="size-5" />
          <span>法案詳細に戻る</span>
        </Button>
      </Link>
    </div>
  );
}

export function InterviewLPPage({
  bill,
  interviewConfig,
  sessionInfo,
  previewToken,
}: InterviewLPPageProps) {
  return (
    <div className="flex flex-col gap-8 pb-8 bg-mirai-light-gradient">
      <_InterviewLPHeader bill={bill} />
      <div className="flex flex-col items-center gap-8 px-4">
        <_InterviewLPHero
          bill={bill}
          billId={bill.id}
          sessionInfo={sessionInfo}
          previewToken={previewToken}
        />
        <_InterviewOverviewSection
          billId={bill.id}
          billName={bill.bill_content?.title ?? bill.name}
          previewToken={previewToken}
        />
        <_InterviewDurationSection />
        <_InterviewThemesSection themes={interviewConfig.themes} />
        <_InterviewNoticeSection />
        <_InterviewFooterActions
          billId={bill.id}
          sessionInfo={sessionInfo}
          previewToken={previewToken}
        />
      </div>
    </div>
  );
}
