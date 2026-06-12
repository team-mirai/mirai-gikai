import { CalendarDays, NotebookText, UserRound } from "lucide-react";
import { formatRoleDescriptionLines } from "../utils/format-utils";

/** 回答日時を "YYYY.M.D HH:mm" で表示する。 */
function formatAnsweredAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** セッションの所要時間（分）。算出できなければ null。 */
function durationMinutes(
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.max(1, Math.round((end - start) / 60000));
}

interface ReportIntervieweeCardProps {
  roleTitle: string | null;
  roleDescription: string | null;
  /** 回答内容の充実度スコア（total_content_richness）。 */
  richness: number | null;
  sessionStartedAt: string | null;
  sessionCompletedAt: string | null;
  characterCount: number;
}

/** レポート詳細の回答者カード（アバター・立場・充実度・回答日/分量）。 */
export function ReportIntervieweeCard({
  roleTitle,
  roleDescription,
  richness,
  sessionStartedAt,
  sessionCompletedAt,
  characterCount,
}: ReportIntervieweeCardProps) {
  const descriptionLines = roleDescription
    ? formatRoleDescriptionLines(roleDescription)
    : [];
  const minutes = durationMinutes(sessionStartedAt, sessionCompletedAt);
  const answeredAt = formatAnsweredAt(sessionStartedAt);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-6">
      {/* アバター + 立場 + 充実度 */}
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mirai-light-gradient">
          <UserRound className="size-7 text-mirai-text-secondary" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-lg font-bold leading-7 text-mirai-text">
            {roleTitle || "回答者"}
          </p>
          {richness !== null && (
            <span className="inline-flex w-fit items-center gap-1 rounded-xl bg-topic-chip-bg px-2 py-1 text-[13px] font-medium text-mirai-text">
              充実度
              <span className="font-bold text-primary-accent">{richness}</span>
            </span>
          )}
        </div>
      </div>

      {/* 立場の詳細 */}
      {descriptionLines.length > 0 && (
        <div className="text-[14px] leading-6 text-mirai-text">
          {descriptionLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}

      {/* 回答日 / インタビュー分量 */}
      <div className="flex items-center gap-4 border-t border-mirai-border pt-3">
        {answeredAt && (
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[13px] text-topic-label">
              <CalendarDays className="size-4 shrink-0" />
              回答日
            </span>
            <span className="text-[13px] font-bold text-mirai-text">
              {answeredAt}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1 border-l border-mirai-border pl-4">
          <span className="flex items-center gap-1.5 text-[13px] text-topic-label">
            <NotebookText className="size-4 shrink-0" />
            インタビュー分量
          </span>
          <span className="text-[13px] font-bold text-mirai-text">
            {minutes !== null ? `${minutes} 分 / ` : ""}
            {characterCount} 文字
          </span>
        </div>
      </div>
    </div>
  );
}
