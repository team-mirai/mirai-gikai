import { createAdminClient } from "@mirai-gikai/supabase";

export async function validatePreviewToken(
  billId: string,
  token?: string
): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
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

    // 有効期限をチェック
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    return expiresAt > now;
  } catch (error) {
    console.error("Error validating preview token:", error);
    return false;
  }
}
