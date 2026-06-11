import { isKnownModel } from "@mirai-gikai/shared/ai/models";
import { z } from "zod";

/**
 * 意見再抽出バックフィルの実行パラメータ（議案スコープ / 対象範囲 / モデル）。
 * worker（CLI 引数）と admin（API リクエスト）の両方から使う純粋な検証ロジック。
 *
 * - scope "pending": 未再抽出（opinions_reextracted_at IS NULL）のレポートだけを対象にする。
 * - scope "all": 既に再抽出済みのレポートも含めて全件やり直す。コストが大きいため
 *   議案指定（billId）必須とし、全議案 × all は許可しない。
 * - model: 再抽出に使う AI モデル（未指定なら呼び出し側の既定モデル）。
 */
export type BackfillScope = "pending" | "all";

export type BackfillParams = {
  billId?: string;
  scope: BackfillScope;
  model?: string;
};

export type BackfillParamsResult =
  | { ok: true; params: BackfillParams }
  | { ok: false; error: string };

const uuidSchema = z.string().uuid();

/**
 * 生の入力（billId / scope / model 文字列）を検証して BackfillParams に正規化する。
 * scope は "all" 以外（未指定含む）を "pending" に丸める。
 * model は未指定なら undefined（呼び出し側で既定モデルを適用）。
 */
export function resolveBackfillParams(input: {
  billId?: string | null;
  scope?: string | null;
  model?: string | null;
}): BackfillParamsResult {
  const scope: BackfillScope = input.scope === "all" ? "all" : "pending";
  const billId = input.billId?.trim() || undefined;
  const model = input.model?.trim() || undefined;

  if (billId && !uuidSchema.safeParse(billId).success) {
    return { ok: false, error: "billId は UUID 形式である必要があります" };
  }
  if (scope === "all" && !billId) {
    return {
      ok: false,
      error: "対象「全部」は議案を指定したときのみ実行できます",
    };
  }
  if (model && !isKnownModel(model)) {
    return { ok: false, error: "未知のモデルIDです" };
  }

  return { ok: true, params: { billId, scope, model } };
}
