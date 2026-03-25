import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPublicReportLink } from "@/features/interview-config/shared/utils/interview-links";
import {
  type InterviewReportRole,
  roleIcons,
  roleLabels,
  stanceBadgeBgStyles,
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
  href?: string;
}

export function ReportCard({
  report,
  summaryMaxLength = 80,
  children,
  href,
}: ReportCardProps) {
  const stanceLabel = report.stance
    ? stanceLabels[report.stance] || report.stance
    : null;
  const stanceTextColor = report.stance
    ? stanceTextColors[report.stance] || ""
    : "";
  const stanceBadgeBg = report.stance
    ? stanceBadgeBgStyles[report.stance] || ""
    : "";
  const RoleIcon = report.role
    ? roleIcons[report.role as InterviewReportRole]
    : null;
  const roleLabel = report.role
    ? roleLabels[report.role as InterviewReportRole] || report.role
    : null;
  const relativeTime = formatRelativeTime(report.created_at);

  const summary = report.summary || "";
  const truncatedSummary =
    summary.length > summaryMaxLength
      ? `${summary.slice(0, summaryMaxLength)}...`
      : summary;

  return (
    <article className="relative bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <Link
        href={(href ?? getPublicReportLink(report.id)) as Route}
        className="absolute inset-0 rounded-lg"
        aria-label={
          [stanceLabel, report.role_title || roleLabel, truncatedSummary]
            .filter(Boolean)
            .join(" / ") || "レポートを見る"
        }
      />
      <div className="flex items-start gap-3">
        {report.stance && (
          <Image
            src={`/icons/stance-${report.stance}.png`}
            alt={stanceLabel || ""}
            width={34}
            height={34}
            className="rounded-full flex-shrink-0"
          />
        )}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 min-w-0 items-center gap-2.5">
                {stanceLabel && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center px-3 py-0.5 rounded-2xl text-xs font-medium leading-3 flex-shrink-0",
                      stanceBadgeBg,
                      stanceTextColor
                    )}
                  >
                    {stanceLabel}
                  </span>
                )}
                {roleLabel && (
                  <div className="flex items-center gap-1 text-mirai-text-subtle flex-shrink-0">
                    {RoleIcon && (
                      <RoleIcon size={16} className="flex-shrink-0" />
                    )}
                    <span className="text-xs leading-3">{roleLabel}</span>
                  </div>
                )}
              </div>
              <span className="text-[13px] text-mirai-text-muted whitespace-nowrap flex-shrink-0">
                {relativeTime}
              </span>
            </div>

            {report.role_title && (
              <p className="text-base font-bold leading-snug text-mirai-text">
                {report.role_title}
              </p>
            )}

            {truncatedSummary && (
              <p className="text-sm leading-6 text-black">{truncatedSummary}</p>
            )}
          </div>

          {children && (
            <div className="relative z-10 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
