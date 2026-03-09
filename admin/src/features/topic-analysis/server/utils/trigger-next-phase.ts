import "server-only";

/**
 * 次フェーズのAPI routeを内部fetchで起動する
 *
 * REVALIDATE_SECRET を Bearer token として使用し、
 * NEXT_PUBLIC_APP_URL を自己呼び出しURLとして使用する
 */
export async function triggerNextPhase(
  phase: 1 | 2 | 3,
  versionId: string,
  billId: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    throw new Error(
      "REVALIDATE_SECRET is not configured for internal phase trigger"
    );
  }

  const url = `${baseUrl}/api/topic-analysis/phases/phase${phase}`;

  console.log(`[TopicAnalysis] Triggering phase ${phase}: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ versionId, billId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to trigger phase ${phase}: ${response.status} ${errorText}`
    );
  }
}

/**
 * 内部フェーズAPI routeの認証を検証する
 */
export function verifyInternalAuth(request: Request): void {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    throw new Error("REVALIDATE_SECRET is not configured");
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    throw new Error("Unauthorized: Invalid bearer token");
  }
}
