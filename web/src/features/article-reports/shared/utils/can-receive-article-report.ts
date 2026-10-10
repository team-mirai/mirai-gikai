import type { Database } from "@mirai-gikai/supabase";

type Bill = Database["public"]["Tables"]["bills"]["Row"];

/** 誤り報告を受け付けるのは公開中のAI自動生成版記事だけ */
export function canReceiveArticleReport(
  bill: Pick<Bill, "publish_status" | "article_kind"> | null
): boolean {
  return (
    bill?.publish_status === "published" && bill.article_kind === "ai_generated"
  );
}
