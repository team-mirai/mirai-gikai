import Image from "next/image";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateWithDots } from "@/lib/utils/date";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { BillDetailShareButton } from "../../../client/components/bill-detail/bill-detail-share-button";
import { BillStatusBadge } from "../../../client/components/bill-list/bill-status-badge";
import { BillTag } from "../../../client/components/bill-list/bill-tag";
import { getBillShareData } from "../../../client/utils/share";
import type { BillWithContent } from "../../../shared/types";

interface BillDetailHeaderProps {
  bill: BillWithContent;
  hasInterviewConfig?: boolean;
}

export async function BillDetailHeader({
  bill,
  hasInterviewConfig,
}: BillDetailHeaderProps) {
  const displayTitle = bill.bill_content?.title;
  const displaySummary = bill.bill_content?.summary;

  const { shareUrl, shareMessage, thumbnailUrl } = await getBillShareData(bill);

  return (
    <div className="mb-8 bg-white rounded-b-4xl">
      {bill.thumbnail_url ? (
        <div className="relative w-full h-72 md:h-80">
          <Image
            src={bill.thumbnail_url}
            alt={bill.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>
      ) : (
        <div className="w-full h-20 bg-white-100" />
      )}

      <div className="px-4 pt-8 mb-3">
        {displayTitle && (
          <h1 className="text-2xl font-bold mb-3">{displayTitle}</h1>
        )}
        <div className="flex flex-row gap-4">
          <BillStatusBadge status={bill.status} className="w-fit" />
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {bill.published_at && (
              <time>{formatDateWithDots(bill.published_at)} 提出</time>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        {displaySummary && (
          <p className="mb-4 leading-relaxed">{displaySummary}</p>
        )}

        {/* タグ表示 */}
        {bill.tags && bill.tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {bill.tags.map((tag) => (
              <BillTag key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground font-medium mb-4">
          {bill.name}
        </p>
        <div className="flex items-center gap-2">
          {hasInterviewConfig && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs gap-1"
            >
              <Link href={getInterviewLPLink(bill.id)}>
                <UserCheck className="h-[18px] w-[18px]" />
                意見を伝える
              </Link>
            </Button>
          )}
          <BillDetailShareButton
            shareMessage={shareMessage}
            shareUrl={shareUrl}
            thumbnailUrl={thumbnailUrl}
          />
        </div>
      </div>
    </div>
  );
}
