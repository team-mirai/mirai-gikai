import type { Database } from "@mirai-gikai/supabase";

type Tables = Database["public"]["Tables"];
type BillRow = Tables["bills"]["Row"];
type BillStatusChangeRow = Tables["bill_status_changes"]["Row"];

/** 節目の事実を組み立てるのに使う、法案と関連テーブルの値 */
export type BillMilestoneSource = Pick<
  BillRow,
  | "id"
  | "name"
  | "slug"
  | "originating_house"
  | "status"
  | "publish_status"
  | "article_kind"
  | "first_published_at"
> & {
  bill_contents: Pick<
    Tables["bill_contents"]["Row"],
    "difficulty_level" | "title"
  >[];
  mirai_stances: Pick<
    Tables["mirai_stances"]["Row"],
    "type" | "is_published" | "publish_at" | "published_at"
  > | null;
  interview_configs: Pick<
    Tables["interview_configs"]["Row"],
    "status" | "published_at" | "deleted_at"
  >[];
  status_changes: Pick<
    BillStatusChangeRow,
    "from_status" | "to_status" | "changed_at"
  >[];
};

export type BillMilestoneFact = {
  billId: string;
  name: string;
  slug: string | null;
  easyTitle: string | null;
  originatingHouse: BillRow["originating_house"];
  status: BillRow["status"];
  publishStatus: BillRow["publish_status"];
  articleKind: BillRow["article_kind"];
  firstPublishedAt: string | null;
  statusChanges: {
    from: BillStatusChangeRow["from_status"];
    to: BillStatusChangeRow["to_status"];
    changedAt: string;
  }[];
  stance: {
    type: Tables["mirai_stances"]["Row"]["type"];
    isPublished: boolean;
    publishedAt: string | null;
  } | null;
  interview: { isPublic: boolean; publishedAt: string | null };
  urls: { bill: string; interview: string };
};
