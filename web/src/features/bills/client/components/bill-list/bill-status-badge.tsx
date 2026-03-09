import { Badge } from "@/components/ui/badge";
import type { BillStatusEnum } from "../../../shared/types";
import {
  getCardStatusLabel,
  getStatusVariant,
} from "../../../shared/utils/bill-status";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  className?: string;
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getCardStatusLabel(status)}
    </Badge>
  );
}
