import "server-only";

import { env } from "@/lib/env";

export type AnalysisStep = "extract" | "merge" | "assign";

/**
 * 次の分析ステップを内部 fetch（Bearer 認証）で起動する。
 * REVALIDATE_SECRET を使い env.adminUrl の step route を自己連鎖で叩く。
 */
export async function triggerStep(
  step: AnalysisStep,
  versionId: string,
  billId: string
): Promise<void> {
  const secret = env.revalidateSecret;
  if (!secret) {
    throw new Error("REVALIDATE_SECRET is not configured for step trigger");
  }

  const url = `${env.adminUrl}/api/user-topic-analysis/steps/${step}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ versionId, billId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to trigger step ${step}: ${response.status} ${text}`
    );
  }
}

/** step route の内部呼び出しを Bearer token で検証する。 */
export function verifyStepInternalAuth(request: Request): void {
  const secret = env.revalidateSecret;
  if (!secret) {
    throw new Error("REVALIDATE_SECRET is not configured");
  }
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    throw new Error("Unauthorized: Invalid bearer token");
  }
}
