import { Badge } from "@/components/ui/badge";
import type { SessionStatus } from "../../shared/types";

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        完了
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-yellow-50 text-yellow-700 border-yellow-200"
    >
      進行中
    </Badge>
  );
}
