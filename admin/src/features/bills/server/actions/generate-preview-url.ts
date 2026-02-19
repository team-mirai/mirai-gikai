"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { env } from "@/lib/env";
import { buildPreviewUrl } from "@/lib/utils/build-preview-url";
import { previewTokenService } from "../services/preview-token-service";

interface GeneratePreviewUrlResult {
  success: boolean;
  url?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export async function generatePreviewUrl(
  billId: string
): Promise<GeneratePreviewUrlResult> {
  await requireAdmin();

  try {
    let tokenInfo = await previewTokenService.getValidToken(billId);

    if (!tokenInfo) {
      tokenInfo = await previewTokenService.createToken(billId);
    }

    return {
      success: true,
      url: buildPreviewUrl(
        env.webUrl,
        `/preview/bills/${billId}`,
        tokenInfo.token
      ),
      token: tokenInfo.token,
      expiresAt: tokenInfo.expiresAt,
    };
  } catch (error) {
    console.error("Error generating preview URL:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
