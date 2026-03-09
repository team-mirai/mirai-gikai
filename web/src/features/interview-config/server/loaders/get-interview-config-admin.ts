import type { Database } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  findLatestInterviewConfigByBillId,
  findPublicInterviewConfigByBillId,
} from "../repositories/interview-config-repository";

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
    // まず公開設定を探す
    const { data: publicData, error: publicError } =
      await findPublicInterviewConfigByBillId(billId);

    if (publicData) {
      return publicData;
    }

    // 公開設定がなければ、最新の更新日の設定を返す
    if (publicError?.code === "PGRST116") {
      const { data: latestData, error: latestError } =
        await findLatestInterviewConfigByBillId(billId);

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
    tags: [CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
