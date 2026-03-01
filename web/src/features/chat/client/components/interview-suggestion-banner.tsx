import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";

interface InterviewSuggestionBannerProps {
  billId: string;
  billName: string;
}

export function InterviewSuggestionBanner({
  billId,
  billName,
}: InterviewSuggestionBannerProps) {
  return (
    <div className="flex gap-3 rounded-2xl bg-mirai-surface-light p-4">
      <div className="flex-shrink-0 size-10 rounded-lg bg-mirai-gradient flex items-center justify-center">
        <Image
          src="/icons/chat-button-icon.svg"
          alt=""
          width={32}
          height={32}
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex">
            <span className="inline-flex items-center px-3 py-1 bg-mirai-surface-muted rounded-2xl text-xs font-medium text-black leading-none">
              法案の当事者の方へ
            </span>
          </div>
          <p className="text-base font-bold leading-[1.5] text-mirai-text">
            {billName}についてのご意見を
            <br />
            お聞かせください
          </p>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Check className="size-5 text-black flex-shrink-0" />
              <span className="text-xs font-medium leading-[1.8] text-mirai-text">
                所要時間は最短約5分〜
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="size-5 text-black flex-shrink-0" />
              <span className="text-xs font-medium leading-[1.8] text-mirai-text">
                AIがあなたの意見を深掘り
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="size-5 text-black flex-shrink-0" />
              <span className="text-xs font-medium leading-[1.8] text-mirai-text">
                ご意見は政策議論に活用します
              </span>
            </div>
          </div>
        </div>
        <Button
          asChild
          className="bg-mirai-gradient text-black border border-black rounded-3xl h-9 px-4 font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2.5"
        >
          <Link href={getInterviewLPLink(billId)}>
            <span>AIインタビューを受ける</span>
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
