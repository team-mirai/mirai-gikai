import { getBillShareData } from "@/features/bills/client/utils/share";
import type { BillWithContent } from "@/features/bills/shared/types";
import { BillShareButtonsClient } from "../../../client/components/share/bill-share-buttons-client";

interface BillShareButtonsProps {
  bill: BillWithContent;
  className?: string;
}

export async function BillShareButtons({
  bill,
  className,
}: BillShareButtonsProps) {
  const { shareUrl, shareMessage, thumbnailUrl } = await getBillShareData(bill);

  return (
    <div className={`flex flex-col gap-3 ${className || ""}`}>
      <BillShareButtonsClient
        shareMessage={shareMessage}
        shareUrl={shareUrl}
        thumbnailUrl={thumbnailUrl}
      />
    </div>
  );
}
