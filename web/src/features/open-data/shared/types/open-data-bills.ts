import type {
  BillStatusEnum,
  HouseEnum,
  StanceTypeEnum,
} from "@/features/bills/shared/types";

export type OpenDataMiraiStance = {
  /** 賛否の種別（for / against など） */
  type: StanceTypeEnum;
  /** 賛否種別の日本語ラベル（賛成 / 反対 など） */
  label: string;
  /** 賛否についての補足コメント */
  comment: string | null;
};

export type OpenDataBillTag = {
  id: string;
  label: string;
};

export type OpenDataBillItem = {
  billId: string;
  /** 議案の正式名称 */
  name: string;
  /** わかりやすいタイトル（難易度別コンテンツ由来） */
  title: string;
  /** 議案の概要（難易度別コンテンツ由来） */
  summary: string;
  status: BillStatusEnum;
  /** 審議状況の日本語ラベル（衆議院審議中 / 成立 など） */
  statusLabel: string;
  statusNote: string | null;
  originatingHouse: HouseEnum;
  /** 提出元議院の日本語ラベル（衆議院 / 参議院） */
  originatingHouseLabel: string;
  submittedDate: string | null;
  publishedAt: string | null;
  tags: OpenDataBillTag[];
  /** チームみらいの賛否。未表明の場合は null */
  miraiStance: OpenDataMiraiStance | null;
  createdAt: string;
};

export type OpenDataBillsResult = {
  items: OpenDataBillItem[];
  nextCursor: string | null;
};

export type OpenDataBillDetail = OpenDataBillItem & {
  /** 議案の本文解説（Markdown、難易度別コンテンツ由来） */
  content: string;
};
