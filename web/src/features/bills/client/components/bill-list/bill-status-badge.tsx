import { Badge } from "@/components/ui/badge";
import type { BillStatusEnum } from "../../../shared/types";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  className?: string;
}

// カード用の簡略化されたステータスラベルを取得
function getCardStatusLabel(status: BillStatusEnum): string {
  switch (status) {
    case "introduced":
    case "in_originating_house":
    case "in_receiving_house":
      return "国会審議中";
    case "enacted":
      return "法案成立";
    case "rejected":
      return "否決";
    default:
      return "法案提出前";
  }
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  const getStatusVariant = (status: BillStatusEnum) => {
    switch (status) {
      case "introduced":
      case "in_originating_house":
      case "in_receiving_house":
        return "light";
      case "enacted":
        return "default";
      case "rejected":
        return "dark";
      default:
        return "muted";
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getCardStatusLabel(status)}
    </Badge>
  );
}
