import {
  BILL_PROPOSAL_TYPE_LABELS,
  type BillProposalType,
} from "@mirai-gikai/shared/bill-proposal-type/labels";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** ステータスバッジ(グラデーション塗り)と混ざらないよう、白地＋枠線にする */
const PROPOSAL_TYPE_BADGE_CLASS_NAMES: Record<BillProposalType, string> = {
  cabinet: "border-primary bg-white text-primary-accent",
  member: "border-mirai-border bg-white text-mirai-text-note",
};

interface BillProposalTypeBadgeProps {
  /** 未設定（null）なら何も表示しない */
  proposalType: BillProposalType | null;
  className?: string;
}

export function BillProposalTypeBadge({
  proposalType,
  className,
}: BillProposalTypeBadgeProps) {
  if (!proposalType) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(PROPOSAL_TYPE_BADGE_CLASS_NAMES[proposalType], className)}
    >
      {BILL_PROPOSAL_TYPE_LABELS[proposalType]}
    </Badge>
  );
}
