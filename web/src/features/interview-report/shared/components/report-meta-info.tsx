import { formatDateTime } from "../utils/report-utils";
import { StanceDisplay } from "./stance-display";
import { RoleDisplay } from "./role-display";

interface ReportMetaInfoProps {
  stance?: string | null;
  role?: string | null;
  sessionStartedAt: string | null;
  duration?: string;
  characterCount: number;
  variant?: "default" | "chat-log";
}

export function ReportMetaInfo({
  stance,
  role,
  sessionStartedAt,
  duration,
  characterCount,
  variant = "default",
}: ReportMetaInfoProps) {
  const isChatLog = variant === "chat-log";

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`flex flex-col items-center ${isChatLog ? "gap-1" : "gap-3"}`}
      >
        {/* スタンス */}
        {stance && <StanceDisplay stance={stance} />}
        {/* 役割 */}
        {role && <RoleDisplay role={role} />}
      </div>

      {/* 日時・時間・文字数 */}
      {isChatLog ? (
        <div className="text-black text-center">
          <p className="text-base font-medium">
            {formatDateTime(sessionStartedAt)}
          </p>
          <p className="text-xs font-normal">
            インタビューの分量{" "}
            <span className="underline">{characterCount}文字</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 font-medium">
          <p className="text-sm text-gray-800">
            {formatDateTime(sessionStartedAt)}
          </p>
          <p className="text-sm text-gray-800">
            {duration
              ? `${duration} / ${characterCount} 文字`
              : `${characterCount} 文字`}
          </p>
        </div>
      )}
    </div>
  );
}
