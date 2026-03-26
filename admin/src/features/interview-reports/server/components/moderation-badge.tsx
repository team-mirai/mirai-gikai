import { Badge } from "@/components/ui/badge";

interface ModerationBadgeProps {
  status: string | null;
  score: number | null;
}

const moderationConfig: Record<string, { label: string; className: string }> = {
  ok: {
    label: "OK",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  warning: {
    label: "Warning",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  ng: {
    label: "NG",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function ModerationBadge({ status, score }: ModerationBadgeProps) {
  if (score == null || !status) {
    return <span className="text-gray-400">-</span>;
  }

  const config = moderationConfig[status] || {
    label: status,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
      <span className="text-xs text-gray-500">{score}</span>
    </div>
  );
}
