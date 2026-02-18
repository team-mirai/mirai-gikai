import { randomBytes } from "node:crypto";
import { createAdminClient } from "@mirai-gikai/supabase";

export interface PreviewTokenInfo {
  token: string;
  expiresAt: string;
}

/**
 * プレビュー用トークンの共通ロジックを提供するサービス
 */
export const previewTokenService = {
  /**
   * 既存の有効なトークンを取得する
   * 期限切れの場合は削除して null を返す
   */
  async getValidToken(billId: string): Promise<PreviewTokenInfo | null> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("preview_tokens")
      .select("token, expires_at")
      .eq("bill_id", billId)
      .single();

    if (error || !data) {
      return null;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (expiresAt > now) {
      return {
        token: data.token,
        expiresAt: data.expires_at,
      };
    }

    // 期限切れの場合は削除
    await supabase.from("preview_tokens").delete().eq("bill_id", billId);
    return null;
  },

  /**
   * 新しいトークンを生成し、データベースに保存する
   */
  async createToken(billId: string): Promise<PreviewTokenInfo> {
    const token = randomBytes(32).toString("hex");
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 30); // 30日有効
    const expiresAt = expiresAtDate.toISOString();

    const supabase = createAdminClient();

    const { error } = await supabase.from("preview_tokens").insert({
      bill_id: billId,
      token,
      expires_at: expiresAt,
      created_by: "admin", // TODO: 実際の管理者IDを使用
    });

    if (error) {
      throw new Error(`Failed to insert preview token: ${error.message}`);
    }

    return { token, expiresAt };
  },

  /**
   * トークンを検証する
   */
  async validateToken(billId: string, token: string): Promise<boolean> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("preview_tokens")
      .select("expires_at")
      .eq("bill_id", billId)
      .eq("token", token)
      .single();

    if (error || !data) {
      return false;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    return expiresAt > now;
  },
};
