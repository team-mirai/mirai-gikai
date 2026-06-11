import type { Database } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  findInterviewConfigById,
  findLatestInterviewConfigByBillId,
  findPublicInterviewConfigByBillId,
} from "../repositories/interview-config-repository";

export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];

/**
 * 管理者用のインタビュー設定取得。
 *
 * - configId が指定されていればその設定をそのまま返す（編集中の非公開設定を
 *   直接プレビューする経路）。指定された設定が存在しない / billId と紐付かない
 *   場合は null を返す（呼び出し側で notFound 扱いにする）。
 * - configId が無ければ、公開設定を優先し、なければ最新の設定を返す。
 */
export async function getInterviewConfigAdmin(
  billId: string,
  configId?: string
): Promise<InterviewConfig | null> {
  return _getCachedInterviewConfigAdmin(billId, configId);
}

const _getCachedInterviewConfigAdmin = unstable_cache(
  async (
    billId: string,
    configId?: string
  ): Promise<InterviewConfig | null> => {
    if (configId) {
      const { data, error } = await findInterviewConfigById(configId);
      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Failed to fetch interview config by id:", error);
        }
        return null;
      }
      return data && data.bill_id === billId ? data : null;
    }

    const { data: publicData, error: publicError } =
      await findPublicInterviewConfigByBillId(billId);
    if (publicData) {
      return publicData;
    }
    if (publicError && publicError.code !== "PGRST116") {
      console.error("Failed to fetch interview config (admin):", publicError);
      return null;
    }

    const { data: latestData, error: latestError } =
      await findLatestInterviewConfigByBillId(billId);
    if (latestError) {
      if (latestError.code !== "PGRST116") {
        console.error("Failed to fetch interview config (admin):", latestError);
      }
      return null;
    }
    return latestData;
  },
  ["interview-config-admin"],
  {
    revalidate: 60, // 非公開設定をプレビューするので短めに
    tags: [CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
