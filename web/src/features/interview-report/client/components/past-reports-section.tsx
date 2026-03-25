import { getInterviewReportCompleteLink } from "@/features/interview-config/shared/utils/interview-links";
import { ReportCard } from "../../shared/components/report-card";
import type { ReportCardData } from "../../shared/components/report-card";

interface PastReportsSectionProps {
  reports: ReportCardData[];
}

export function PastReportsSection({ reports }: PastReportsSectionProps) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[370px]">
      <h2 className="text-[15px] font-bold leading-[28px] text-black">
        過去のレポート
      </h2>
      <div className="flex flex-col gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-black rounded-lg overflow-hidden"
          >
            <ReportCard
              report={report}
              href={getInterviewReportCompleteLink(report.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
