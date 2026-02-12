import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BILL_STATUS_CONFIG } from "../../constants/bill-config";
import { getBills } from "../../loaders/get-bills";
import type { Bill, BillStatus } from "../../types";
import { getBillStatusLabel } from "../../types";
import { BillActionsMenu } from "../bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "./preview-button";
import { PublishStatusBadge } from "./publish-status-badge";
import { ViewButton } from "./view-button";

function StatusBadge({
  status,
  originatingHouse,
}: {
  status: BillStatus;
  originatingHouse: Bill["originating_house"];
}) {
  const config = BILL_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 py-1 rounded-full text-sm font-bold">
      <Icon className="h-4 w-4" />
      <span>{getBillStatusLabel(status, originatingHouse)}</span>
    </div>
  );
}

export async function BillList() {
  const bills = await getBills();

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-600">{bills.length}件の議案</div>
        <Link href="/bills/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>議案名</TableHead>
              <TableHead>公開ステータス</TableHead>
              <TableHead>審議ステータス</TableHead>
              <TableHead>公開日</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <BillRow key={bill.id} bill={bill} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BillRow({ bill }: { bill: Bill }) {
  return (
    <TableRow>
      <TableCell className="max-w-[300px]">
        <Link
          href={`/bills/${bill.id}/edit`}
          className="block truncate font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {bill.name}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <PublishStatusBadge
            billId={bill.id}
            publishStatus={bill.publish_status}
          />
          {(bill.publish_status === "draft" ||
            bill.publish_status === "coming_soon") && (
            <PreviewButton billId={bill.id} />
          )}
          {bill.publish_status === "published" && (
            <ViewButton billId={bill.id} />
          )}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge
          status={bill.status}
          originatingHouse={bill.originating_house}
        />
      </TableCell>
      <TableCell className="text-gray-600">
        {bill.published_at
          ? new Date(bill.published_at).toLocaleDateString("ja-JP")
          : "-"}
      </TableCell>
      <TableCell>
        <BillActionsMenu billId={bill.id} billName={bill.name} />
      </TableCell>
    </TableRow>
  );
}
