import Image from "next/image";
import { EXTERNAL_LINKS } from "@/config/external-links";

export function ReportProblemButton() {
  return (
    <a
      href={EXTERNAL_LINKS.REPORT}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 py-2 text-base font-bold"
    >
      <Image
        src="/icons/report-error.svg"
        alt="報告アイコン"
        width={20}
        height={20}
        className="shrink-0"
      />
      問題を報告する
    </a>
  );
}
