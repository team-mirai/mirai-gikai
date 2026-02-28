import { StanceBadge } from "@/features/bills/client/components/bill-list/stance-badge";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";
import { allStanceTypes } from "../../../_lib/mock-data";

export default function StanceBadgePreview() {
  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">StanceBadge</h1>

      <ComponentShowcase
        title="All Variants"
        description="@/features/bills/client/components/bill-list/stance-badge"
      >
        <PreviewSection label="全スタンスタイプ">
          <div className="flex flex-wrap gap-3">
            {allStanceTypes.map((stance) => (
              <StanceBadge key={stance} stance={stance} />
            ))}
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
