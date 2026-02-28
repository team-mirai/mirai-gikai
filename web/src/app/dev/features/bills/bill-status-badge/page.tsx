import type { Metadata } from "next";
import { BillStatusBadge } from "@/features/bills/client/components/bill-list/bill-status-badge";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";
import { allBillStatuses } from "../../../_lib/mock-data";

export const metadata: Metadata = {
  title: "BillStatusBadge",
};

export default function BillStatusBadgePreview() {
  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">
        BillStatusBadge
      </h1>

      <ComponentShowcase
        title="All Variants"
        description="@/features/bills/client/components/bill-list/bill-status-badge"
      >
        <PreviewSection label="全ステータス">
          <div className="flex flex-wrap gap-3">
            {allBillStatuses.map((status) => (
              <BillStatusBadge key={status} status={status} />
            ))}
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
