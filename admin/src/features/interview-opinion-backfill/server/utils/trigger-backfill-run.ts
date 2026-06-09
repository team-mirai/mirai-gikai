import "server-only";

import { env } from "@/lib/env";

/**
 * バックフィルの run route を内部 fetch で（再）起動する。
 * REVALIDATE_SECRET を Bearer token として使い、env.adminUrl を自己呼び出しURLにする。
 */
export async function triggerBackfillRun(): Promise<void> {
  const secret = env.revalidateSecret;
  if (!secret) {
    throw new Error("REVALIDATE_SECRET is not configured for backfill trigger");
  }

  const url = `${env.adminUrl}/api/interview-opinion-backfill/run`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to trigger backfill run: ${response.status} ${text}`
    );
  }
}

/** run route の内部呼び出しを Bearer token で検証する。 */
export function verifyBackfillInternalAuth(request: Request): void {
  const secret = env.revalidateSecret;
  if (!secret) {
    throw new Error("REVALIDATE_SECRET is not configured");
  }
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    throw new Error("Unauthorized: Invalid bearer token");
  }
}
