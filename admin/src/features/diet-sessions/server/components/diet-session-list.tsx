import { DietSessionItem } from "../../client/components/diet-session-item";
import type { DietSession } from "../../shared/types";

type DietSessionListProps = {
  sessions: DietSession[];
};

export function DietSessionList({ sessions }: DietSessionListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        国会会期一覧 ({sessions.length}件)
      </h2>

      {sessions.length === 0 ? (
        <p className="text-gray-500">国会会期がありません</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <DietSessionItem key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
