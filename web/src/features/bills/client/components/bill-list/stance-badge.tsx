import { Badge } from "@/components/ui/badge";
import type { StanceTypeEnum } from "../../../shared/types";
import { STANCE_LABELS } from "../../../shared/types";

interface StanceBadgeProps {
  stance: StanceTypeEnum;
  className?: string;
}

export function StanceBadge({ stance, className }: StanceBadgeProps) {
  const getStanceStyles = (stance: StanceTypeEnum) => {
    switch (stance) {
      case "for":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "against":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "neutral":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case "conditional_for":
        return "bg-lime-100 text-lime-800 hover:bg-lime-200";
      case "conditional_against":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "considering":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Badge
      variant="outline"
      className={`${getStanceStyles(stance)} border-transparent ${className || ""}`}
    >
      {STANCE_LABELS[stance]}
    </Badge>
  );
}
