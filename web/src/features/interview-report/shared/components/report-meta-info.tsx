import type { Route } from "next";
import Link from "next/link";
import { getInterviewChatLogLink } from "@/features/interview-config/shared/utils/interview-links";
import { formatDateTime } from "../utils/report-utils";
import { RoleDisplay } from "./role-display";
import { StanceDisplay } from "./stance-display";

interface ReportMetaInfoProps {
  reportId: string;
  stance?: string | null;
  role?: string | null;
  roleTitle?: string | null;
  sessionStartedAt: string | null;
  duration?: string;
  characterCount: number;
  /** 遷移元のコンテキスト */
  from?: "complete";
  variant?: "default" | "chat-log";
}

export function ReportMetaInfo({
  reportId,
  stance,
  role,
  roleTitle,
  sessionStartedAt,
  duration,
  characterCount,
  from,
  variant = "default",
}: ReportMetaInfoProps) {
  const isChatLog = variant === "chat-log";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex flex-col items-center ${isChatLog ? "gap-1" : "gap-3"}`}
      >
        {/* スタンス */}
        {stance && <StanceDisplay stance={stance} />}
        {/* 役割 */}
        {(role || roleTitle) && (
          <RoleDisplay role={role} roleTitle={roleTitle} />
        )}
      </div>

      {/* 日時・時間・文字数 */}
      {isChatLog ? (
        <div className="text-black text-center">
          <p className="text-base font-medium">
            {formatDateTime(sessionStartedAt)}
          </p>
          <p className="text-xs font-normal">
            インタビューの分量 <span>{characterCount}文字</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 font-medium">
          <p className="text-[15px] text-black">
            {formatDateTime(sessionStartedAt)}
          </p>
          <Link
            href={getInterviewChatLogLink(reportId, from) as Route}
            className="text-[15px] text-black"
          >
            {duration ? `${duration} / ` : ""}
            <span className="underline">{characterCount} 文字</span>
          </Link>
        </div>
      )}
    </div>
  );
}
