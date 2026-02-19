import { findPreviewToken } from "../repositories/bill-repository";

export async function validatePreviewToken(
  billId: string,
  token?: string
): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    const data = await findPreviewToken(billId, token);

    if (!data) {
      return false;
    }

    // 有効期限をチェック
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    return expiresAt > now;
  } catch (error) {
    console.error("Error validating preview token:", error);
    return false;
  }
}
