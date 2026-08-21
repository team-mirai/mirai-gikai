import "server-only";

import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SuggestableBill } from "../../shared/utils/suggest-bills";
import { findPublishedBillsForSuggest } from "../repositories/bill-repository";

/**
 * 検索モーダルの候補一覧。
 *
 * 要約は載せない。候補行に出るのはタイトルだけなので、要約に当たって出てきた
 * 行は「なぜこれが出たのか」が読み手に分からない。ここで落としておくことが
 * その保証になる。
 */
export async function getSuggestableBills(): Promise<SuggestableBill[]> {
  // キャッシュ外で cookies を読む
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedSuggestableBills(difficultyLevel);
}

const _getCachedSuggestableBills = unstable_cache(
  async (difficultyLevel: DifficultyLevelEnum): Promise<SuggestableBill[]> => {
    const rows = await findPublishedBillsForSuggest(difficultyLevel);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      bill_content: { title: row.bill_contents[0]?.title },
      tags: row.bills_tags
        .map((link) => link.tags)
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
    }));
  },
  ["suggestable-bills"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
