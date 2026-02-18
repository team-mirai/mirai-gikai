import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];

export async function getInterviewConfig(
  billId: string
): Promise<InterviewConfig | null> {
  return _getCachedInterviewConfig(billId);
}

const _getCachedInterviewConfig = unstable_cache(
  async (billId: string): Promise<InterviewConfig | null> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("interview_configs")
      .select("*")
      .eq("bill_id", billId)
      .eq("status", "public") // 公開ステータスのみ
      .single();

    if (error) {
      // レコードが存在しない場合はnullを返す（エラーではない）
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Failed to fetch interview config:", error);
      return null;
    }

    return data;
  },
  ["interview-config"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
