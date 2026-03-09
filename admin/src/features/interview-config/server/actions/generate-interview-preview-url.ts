"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { env } from "@/lib/env";
import { buildPreviewUrl } from "@/lib/utils/build-preview-url";
import { previewTokenService } from "../../../bills/server/services/preview-token-service";

interface GenerateInterviewPreviewUrlResult {
  success: boolean;
  url?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export async function generateInterviewPreviewUrl(
  billId: string
): Promise<GenerateInterviewPreviewUrlResult> {
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
        `/preview/bills/${billId}/interview`,
        tokenInfo.token
      ),
      token: tokenInfo.token,
      expiresAt: tokenInfo.expiresAt,
    };
  } catch (error) {
    console.error("Error generating interview preview URL:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
