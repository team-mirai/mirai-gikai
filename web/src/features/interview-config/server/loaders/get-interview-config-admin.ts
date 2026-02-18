import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];

/**
 * 管理者用のインタビュー設定取得
 * 複数設定がある場合は、公開設定を優先し、なければ最新の設定を返す
 */
export async function getInterviewConfigAdmin(
  billId: string
): Promise<InterviewConfig | null> {
  return _getCachedInterviewConfigAdmin(billId);
}

const _getCachedInterviewConfigAdmin = unstable_cache(
  async (billId: string): Promise<InterviewConfig | null> => {
    const supabase = createAdminClient();

    // まず公開設定を探す
    const { data: publicData, error: publicError } = await supabase
      .from("interview_configs")
      .select("*")
      .eq("bill_id", billId)
      .eq("status", "public")
      .single();

    if (publicData) {
      return publicData;
    }

    // 公開設定がなければ、最新の更新日の設定を返す
    if (publicError?.code === "PGRST116") {
      const { data: latestData, error: latestError } = await supabase
        .from("interview_configs")
        .select("*")
        .eq("bill_id", billId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        if (latestError.code === "PGRST116") {
          return null;
        }
        console.error("Failed to fetch interview config (admin):", latestError);
        return null;
      }

      return latestData;
    }

    console.error("Failed to fetch interview config (admin):", publicError);
    return null;
  },
  ["interview-config-admin"],
  {
    revalidate: 60, // 非公開設定をプレビューするので短めに
    tags: [CACHE_TAGS.BILLS],
  }
);
