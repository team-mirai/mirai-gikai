import { BillCard } from "@/features/bills/client/components/bill-list/bill-card";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";
import { createMockBill } from "../../../_lib/mock-data";

export default function BillCardPreview() {
  const defaultBill = createMockBill();

  const featuredBill = createMockBill({
    id: "mock-featured",
    is_featured: true,
    bill_content: {
      id: "mock-content-featured",
      bill_id: "mock-featured",
      title: "注目の法案タイトル",
      summary:
        "注目フラグが立っている法案のカード表示。注目バッジが表示されます。",
      content: "",
      difficulty_level: "normal",
      created_at: "2026-02-15T00:00:00Z",
      updated_at: "2026-02-15T00:00:00Z",
    },
    tags: [
      { id: "tag-1", label: "経済" },
      { id: "tag-2", label: "デジタル" },
      { id: "tag-3", label: "行政改革" },
    ],
  });

  const withStanceBill = createMockBill({
    id: "mock-with-stance",
    mirai_stance: {
      id: "mock-stance",
      bill_id: "mock-with-stance",
      type: "for",
      comment: "賛成の理由がここに入ります。",
      created_at: "2026-02-15T00:00:00Z",
      updated_at: "2026-02-15T00:00:00Z",
    },
  });

  const enactedBill = createMockBill({
    id: "mock-enacted",
    status: "enacted",
    bill_content: {
      id: "mock-content-enacted",
      bill_id: "mock-enacted",
      title: "成立済みの法案タイトル",
      summary:
        "この法案は既に成立しています。ステータスが「成立」で表示されます。",
      content: "",
      difficulty_level: "normal",
      created_at: "2026-02-15T00:00:00Z",
      updated_at: "2026-02-15T00:00:00Z",
    },
  });

  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">BillCard</h1>

      <ComponentShowcase title="Default" description="基本的な法案カード">
        <PreviewSection label="通常表示">
          <div className="max-w-sm">
            <BillCard bill={defaultBill} />
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase title="Featured" description="注目バッジ付き">
        <PreviewSection label="is_featured: true">
          <div className="max-w-sm">
            <BillCard bill={featuredBill} />
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase title="With Stance" description="みらいのスタンス付き">
        <PreviewSection label="mirai_stance: for">
          <div className="max-w-sm">
            <BillCard bill={withStanceBill} />
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase title="Enacted" description="成立済みステータス">
        <PreviewSection label="status: enacted">
          <div className="max-w-sm">
            <BillCard bill={enactedBill} />
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
