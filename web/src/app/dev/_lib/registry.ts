type PreviewItem = {
  path: string;
  label: string;
  description: string;
};

type PreviewGroup = {
  name: string;
  items: PreviewItem[];
};

export const previewRegistry: PreviewGroup[] = [
  {
    name: "UI Primitives",
    items: [
      {
        path: "/dev/ui",
        label: "UI Components",
        description: "Button, Badge, Card, SpeechBubble",
      },
    ],
  },
  {
    name: "Bills",
    items: [
      {
        path: "/dev/features/bills/bill-card",
        label: "BillCard",
        description: "法案カードコンポーネント",
      },
      {
        path: "/dev/features/bills/bill-status-badge",
        label: "BillStatusBadge",
        description: "法案ステータスバッジ全バリアント",
      },
    ],
  },
  {
    name: "Interview",
    items: [
      {
        path: "/dev/features/interview/consent-modal",
        label: "ConsentModal",
        description: "AIインタビュー同意モーダル",
      },
    ],
  },
];
