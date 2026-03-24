import type { Route } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillActionsMenu } from "../../../client/components/bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "../../../client/components/bill-list/preview-button";
import { PublishStatusBadge } from "../../../client/components/bill-list/publish-status-badge";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { ViewButton } from "../../../client/components/bill-list/view-button";
import { BILL_STATUS_CONFIG } from "../../../shared/constants/bill-config";
import type {
  BillSortConfig,
  BillStatus,
  BillWithDietSession,
} from "../../../shared/types";
import { getBillStatusLabel } from "../../../shared/types";
import { getBills } from "../../loaders/get-bills";

function StatusBadge({
  status,
  originatingHouse,
}: {
  status: BillStatus;
  originatingHouse: BillWithDietSession["originating_house"];
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

export async function BillList({ sortConfig }: { sortConfig: BillSortConfig }) {
  const bills = await getBills(sortConfig);

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-600">{bills.length}件の議案</div>
        <Link href={routes.billNew()}>
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
              <TableHead>国会会期</TableHead>
              <SortableTableHead
                field="publish_status_order"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                公開ステータス
              </SortableTableHead>
              <SortableTableHead
                field="status_order"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                審議ステータス
              </SortableTableHead>
              <SortableTableHead
                field="published_at"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                公開日
              </SortableTableHead>
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

function BillRow({ bill }: { bill: BillWithDietSession }) {
  return (
    <TableRow>
      <TableCell className="max-w-[400px]">
        <Link
          href={routes.billEdit(bill.id) as Route}
          className="block truncate font-medium hover:underline"
        >
          {bill.name}
        </Link>
      </TableCell>
      <TableCell className="text-gray-600">
        {bill.diet_sessions?.name ?? "-"}
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
