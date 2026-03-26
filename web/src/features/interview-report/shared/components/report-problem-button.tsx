import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EXTERNAL_LINKS } from "@/config/external-links";

export function ReportProblemButton() {
  return (
    <Button
      variant="outline"
      asChild
      className="rounded-full px-6 py-3 h-auto font-bold text-base bg-white text-gray-800 hover:bg-gray-50 border-gray-800"
    >
      <a href={EXTERNAL_LINKS.REPORT} target="_blank" rel="noopener noreferrer">
        <Image
          src="/icons/report-error.svg"
          alt="報告アイコン"
          width={26}
          height={26}
          className="shrink-0"
        />
        問題を報告する
      </a>
    </Button>
  );
}
