import "server-only";

import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { findBillsWithPublicInterview } from "../repositories/bill-repository";

/**
 * AIインタビュー受付中の議案を取得する
 *
 * トップの「AIインタビュー受付中」セクションに使う。注目やタグ別と違って
 * 会期でも掲載タグでも絞らないので、受付中のものは漏れなくここに並ぶ。
 */
export async function getInterviewOpenBills(): Promise<BillWithContent[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();

  try {
    return await _getCachedInterviewOpenBills(difficultyLevel);
  } catch (error) {
    // 取得失敗はキャッシュ関数の外で受ける。中で空配列に変換すると、失敗が
    // 正常な結果として10分キャッシュされてしまう。トップは他のセクションが
    // 出れば成立するので、ここで空に縮退させる。
    console.error("Failed to fetch interview open bills:", error);
    return [];
  }
}

const _getCachedInterviewOpenBills = unstable_cache(
  async (difficultyLevel: DifficultyLevelEnum): Promise<BillWithContent[]> => {
    const data = await findBillsWithPublicInterview(difficultyLevel);

    return data.map((item) => {
      const {
        bill_contents,
        bills_tags,
        interview_configs: _configs,
        ...bill
      } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: bills_tags
          .map((link) => link.tags)
          .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
        // クエリの絞り込み条件そのものなので、取得結果は全件が受付中。
        hasPublicInterview: true,
      };
      // BillContent は bill_contents の全カラム型だが、クエリは解説本文
      // （content）を引いていない。カードが使うのはタイトルと要約だけなので、
      // ここで返す bill_content の content は参照しないこと。
    }) as BillWithContent[];
  },
  ["interview-open-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
