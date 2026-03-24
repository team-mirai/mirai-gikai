import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPublicReportLink } from "@/features/interview-config/shared/utils/interview-links";
import {
  type InterviewReportRole,
  formatRoleLabel,
  roleIcons,
  stanceLabels,
  stanceTextColors,
} from "../constants";
import { formatRelativeTime } from "../utils/format-relative-time";

export interface ReportCardData {
  id: string;
  stance: string | null;
  role: string | null;
  role_title: string | null;
  summary: string | null;
  created_at: string;
}

interface ReportCardProps {
  report: ReportCardData;
  summaryMaxLength?: number;
  children?: React.ReactNode;
}

export function ReportCard({
  report,
  summaryMaxLength = 80,
  children,
}: ReportCardProps) {
  const stanceLabel = report.stance
    ? stanceLabels[report.stance] || report.stance
    : null;
  const stanceTextColor = report.stance
    ? stanceTextColors[report.stance] || ""
    : "";
  const RoleIcon = report.role
    ? roleIcons[report.role as InterviewReportRole]
    : null;
  const roleLabel = formatRoleLabel(report.role, report.role_title);
  const relativeTime = formatRelativeTime(report.created_at);

  const summary = report.summary || "";
  const truncatedSummary =
    summary.length > summaryMaxLength
      ? `${summary.slice(0, summaryMaxLength)}...`
      : summary;

  return (
    <article className="relative bg-white rounded-lg px-4 py-[18px] hover:bg-gray-50 transition-colors">
      <Link
        href={getPublicReportLink(report.id) as Route}
        className="absolute inset-0 rounded-lg"
        aria-label={
          [stanceLabel, roleLabel, truncatedSummary]
            .filter(Boolean)
            .join(" / ") || "レポートを見る"
        }
      />
      <div className="flex items-start gap-2.5">
        {report.stance && (
          <Image
            src={`/icons/stance-${report.stance}.png`}
            alt={stanceLabel || ""}
            width={38}
            height={38}
            className="rounded-full flex-shrink-0"
          />
        )}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {stanceLabel && (
            <span
              className={cn(
                "text-base font-bold leading-4 tracking-[0.01em]",
                stanceTextColor
              )}
            >
              {stanceLabel}
            </span>
          )}
          {roleLabel && (
            <div className="flex items-center gap-1 text-mirai-text-subtle">
              {RoleIcon && <RoleIcon size={16} className="flex-shrink-0" />}
              <span className="text-xs leading-3">{roleLabel}</span>
            </div>
          )}
        </div>
        <span className="text-[13px] text-mirai-text-muted whitespace-nowrap flex-shrink-0">
          {relativeTime}
        </span>
      </div>

      {truncatedSummary && (
        <p className="mt-2 text-[13px] leading-[22px] text-black">
          {truncatedSummary}
        </p>
      )}

      {children && (
        <div className="relative z-10 mt-2 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
          {children}
        </div>
      )}
    </article>
  );
}
