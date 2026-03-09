import { Badge } from "@/components/ui/badge";

interface StanceBadgeProps {
  stance: string | null;
}

const stanceConfig: Record<string, { label: string; className: string }> = {
  for: {
    label: "賛成",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  against: {
    label: "反対",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  neutral: {
    label: "中立",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
  conditional_for: {
    label: "条件付き賛成",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  conditional_against: {
    label: "条件付き反対",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  considering: {
    label: "検討中",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  continued_deliberation: {
    label: "継続審議",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function StanceBadge({ stance }: StanceBadgeProps) {
  if (!stance) return <span className="text-gray-400">-</span>;

  const config = stanceConfig[stance] || {
    label: stance,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
