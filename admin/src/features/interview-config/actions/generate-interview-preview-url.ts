"use server";

import { requireAdmin } from "@/features/auth/lib/auth-server";
import { env } from "@/lib/env";
import { previewTokenService } from "../../bills/services/preview-token-service";

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
      url: _buildPreviewUrl(billId, tokenInfo.token),
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

// プレビューURLを構築
function _buildPreviewUrl(billId: string, token: string): string {
  return `${env.webUrl}/preview/bills/${billId}/interview?token=${token}`;
}
