import { randomBytes } from "node:crypto";
import {
  findPreviewToken,
  createPreviewToken,
  deletePreviewTokenByBillId,
  findPreviewTokenForValidation,
} from "../repositories/bill-repository";

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
    const data = await findPreviewToken(billId);

    if (!data) {
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
    await deletePreviewTokenByBillId(billId);
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

    await createPreviewToken({
      billId,
      token,
      expiresAt,
      createdBy: "admin", // TODO: 実際の管理者IDを使用
    });

    return { token, expiresAt };
  },

  /**
   * トークンを検証する
   */
  async validateToken(billId: string, token: string): Promise<boolean> {
    const data = await findPreviewTokenForValidation(billId, token);

    if (!data) {
      return false;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    return expiresAt > now;
  },
};
