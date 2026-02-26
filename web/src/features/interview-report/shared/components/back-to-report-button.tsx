import { Undo2 } from "lucide-react";
import Link from "next/link";
import { getInterviewReportCompleteLink } from "@/features/interview-config/shared/utils/interview-links";

interface BackToReportButtonProps {
  reportId: string;
}

export function BackToReportButton({ reportId }: BackToReportButtonProps) {
  return (
    <Link
      href={getInterviewReportCompleteLink(reportId)}
      className="flex items-center justify-center gap-2.5 px-6 py-3 border border-gray-800 rounded-full bg-mirai-gradient"
    >
      <Undo2 className="w-5 h-5 text-gray-800" />
      <span className="text-base font-bold text-gray-800">レポートに戻る</span>
    </Link>
  );
}
