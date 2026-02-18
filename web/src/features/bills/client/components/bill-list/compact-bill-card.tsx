import Image from "next/image";
import { Card } from "@/components/ui/card";
import { formatDateWithDots } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { BillStatusBadge } from "./bill-status-badge";

interface CompactBillCardProps {
  bill: BillWithContent;
  className?: string;
}

/**
 * コンパクトな水平レイアウトの法案カード
 * 過去国会セクションや過去国会議案一覧ページで使用
 */
export function CompactBillCard({ bill, className }: CompactBillCardProps) {
  const displayTitle = bill.bill_content?.title || bill.name;

  return (
    <Card
      className={`border border-black hover:bg-muted/50 transition-colors overflow-hidden ${className ?? ""}`}
    >
      <div className="flex">
        {/* コンテンツエリア */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <h3 className="font-bold text-base leading-tight line-clamp-2">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-2">
            <BillStatusBadge status={bill.status} className="w-fit" />
            <span className="text-xs text-muted-foreground">
              {bill.published_at
                ? `${formatDateWithDots(bill.published_at)} 提出`
                : "法案提出前"}
            </span>
          </div>
        </div>

        {/* サムネイル画像 */}
        {bill.thumbnail_url && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={bill.thumbnail_url}
              alt={bill.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
