import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatEstimatedDuration } from "@/features/interview-config/shared/utils/format-estimated-duration";

interface InterviewLandingSectionProps {
  billId: string;
  estimatedDuration: number | null;
}

function getCheckPoints(estimatedDuration: number | null): string[] {
  const durationText = formatEstimatedDuration(estimatedDuration);
  return [
    durationText ? `所要時間は${durationText}` : null,
    "AIがあなたのご意見を深掘り",
    "チームみらいの政策検討に活用",
  ].filter((text): text is string => text !== null);
}

function _InterviewBadge() {
  return (
    <div className="flex">
      <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-mirai-surface-tag rounded-2xl">
        <span className="text-[11px] font-medium text-black leading-[1.09]">
          法案の当事者の方へ
        </span>
      </div>
    </div>
  );
}

function _CheckPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1">
      <Check className="size-5 text-black flex-shrink-0" />
      <span className="text-[13px] font-medium leading-[1.8]">{text}</span>
    </div>
  );
}

function _CheckPointsList({
  estimatedDuration,
}: {
  estimatedDuration: number | null;
}) {
  const checkPoints = getCheckPoints(estimatedDuration);
  return (
    <div className="flex flex-col gap-2">
      {checkPoints.map((text) => (
        <_CheckPoint key={text} text={text} />
      ))}
    </div>
  );
}

function _InterviewCTAButton({ billId }: { billId: string }) {
  return (
    <Link href={`/bills/${billId}/interview`}>
      <Button className="w-[224px] bg-mirai-gradient text-black border border-black rounded-3xl h-[42px] px-5 font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
        <span>AIインタビューを受ける</span>
        <ArrowRight className="size-4" />
      </Button>
    </Link>
  );
}

function _InterviewIllustration() {
  return (
    <div className="absolute right-6 bottom-[-32px] w-[113.6px] h-[177px] pointer-events-none">
      <Image
        src="/illustrations/interview-illustration.png"
        alt=""
        width={114}
        height={177}
        className="object-contain"
      />
    </div>
  );
}

export function InterviewLandingSection({
  billId,
  estimatedDuration,
}: InterviewLandingSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-6 mx-auto">
      <_InterviewIllustration />

      <div className="relative z-1 flex flex-col gap-2">
        <_InterviewBadge />

        <div className="space-y-2">
          <h2 className="text-lg font-bold leading-[1.67]">
            本法案についてのご意見を
            <br className="pc:hidden" />
            お聞かせください
          </h2>

          <_CheckPointsList estimatedDuration={estimatedDuration} />

          <div className="pt-2">
            <_InterviewCTAButton billId={billId} />
          </div>
        </div>
      </div>
    </div>
  );
}
