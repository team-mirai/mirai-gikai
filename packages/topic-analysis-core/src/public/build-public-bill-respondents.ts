import { mapRoleToCategory } from "./build-public-topic-analysis";
import { normalizeRoleTitle } from "./normalize-role-title";
import { normalizeStanceToSentiment } from "./normalize-stance";
import type { PublicRespondent, RawRespondentRow } from "./public-types";

/**
 * 公開レポートの生行から、回答一覧カード用の表示データを構築する純粋関数。
 * role→カテゴリ・stance→期待/懸念に正規化する。フィルタは取得側で適用済み。
 */
export function buildPublicBillRespondents(
  rows: RawRespondentRow[]
): PublicRespondent[] {
  return rows.map((r) => ({
    id: r.id,
    user_category: mapRoleToCategory(r.role),
    role_title: normalizeRoleTitle(r.role_title),
    bill_sentiment: normalizeStanceToSentiment(r.stance),
    summary: r.summary,
    created_at: r.created_at,
  }));
}
