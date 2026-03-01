import "server-only";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type InterviewReportRole,
  formatRoleLabel,
  roleIcons,
  stanceLabels,
  stanceTextColors,
} from "../../shared/constants";
import { formatRelativeTime } from "../../shared/utils/format-relative-time";
import type { PublicInterviewReport } from "../loaders/get-public-reports-by-bill-id";

const SUMMARY_MAX_LENGTH = 80;

function _ReportCard({ report }: { report: PublicInterviewReport }) {
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
    summary.length > SUMMARY_MAX_LENGTH
      ? `${summary.slice(0, SUMMARY_MAX_LENGTH)}...`
      : summary;

  return (
    <Link
      href={`/report/${report.id}/chat-log`}
      className="block bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
    >
      {/* ヘッダー: スタンスアイコン + スタンスラベル + 役割 + 日時 */}
      <div className="flex items-center gap-2">
        {report.stance && (
          <Image
            src={`/icons/stance-${report.stance}.png`}
            alt={stanceLabel || ""}
            width={38}
            height={38}
            className="rounded-full flex-shrink-0"
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {stanceLabel && (
            <span className={cn("text-base font-bold", stanceTextColor)}>
              {stanceLabel}
            </span>
          )}
          <div className="flex items-center gap-2">
            {roleLabel && (
              <div className="flex items-center gap-0.5 text-mirai-text-subtle">
                {RoleIcon && <RoleIcon size={16} className="flex-shrink-0" />}
                <span className="text-xs">{roleLabel}</span>
              </div>
            )}
            <span className="text-[13px] text-mirai-text-muted leading-[1.2]">
              {relativeTime}
            </span>
          </div>
        </div>
      </div>

      {/* 本文 */}
      {truncatedSummary && (
        <p className="mt-2 text-[13px] leading-[1.692] text-black">
          {truncatedSummary}
        </p>
      )}
    </Link>
  );
}

interface BillInterviewOpinionsSectionProps {
  reports: PublicInterviewReport[];
  totalCount: number;
}

export function BillInterviewOpinionsSection({
  reports,
  totalCount,
}: BillInterviewOpinionsSectionProps) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-4">
        <h2 className="text-[22px] font-bold leading-[1.636]">
          <span className="mr-1">💬</span>法案が関係する方のご意見
        </h2>
        <span className="text-[22px] font-bold leading-[1.636]">
          {totalCount}件
        </span>
      </div>

      {/* レポートカード一覧 */}
      <div className="flex flex-col gap-4">
        {reports.map((report) => (
          <_ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
