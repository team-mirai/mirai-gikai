import type {
  BillStatusEnum,
  BillWithContent,
  StanceTypeEnum,
} from "@/features/bills/shared/types";

export const allBillStatuses: BillStatusEnum[] = [
  "preparing",
  "introduced",
  "in_originating_house",
  "in_receiving_house",
  "enacted",
  "rejected",
];

export const allStanceTypes: StanceTypeEnum[] = [
  "for",
  "against",
  "neutral",
  "conditional_for",
  "conditional_against",
  "considering",
  "continued_deliberation",
];

const baseBill: BillWithContent = {
  id: "mock-bill-001",
  name: "サンプル法案（第XXX回国会提出）",
  status: "in_originating_house",
  originating_house: "HR",
  is_featured: false,
  thumbnail_url: null,
  share_thumbnail_url: null,
  published_at: "2026-02-15",
  publish_status: "published",
  shugiin_url: null,
  status_note: null,
  diet_session_id: "mock-session",
  created_at: "2026-02-15T00:00:00Z",
  updated_at: "2026-02-15T00:00:00Z",
  bill_content: {
    id: "mock-content-001",
    bill_id: "mock-bill-001",
    title: "サンプル法案のタイトル",
    summary:
      "この法案は開発プレビュー用のサンプルデータです。法案の要約文がここに表示されます。実際のデータではありません。",
    content: "# サンプルコンテンツ\n\n本文がここに入ります。",
    difficulty_level: "normal",
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
  },
  tags: [
    { id: "tag-1", label: "経済" },
    { id: "tag-2", label: "環境" },
  ],
};

export function createMockBill(
  overrides: Partial<BillWithContent> = {}
): BillWithContent {
  return {
    ...baseBill,
    ...overrides,
  };
}
