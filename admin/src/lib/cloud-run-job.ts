import "server-only";

import { GoogleAuth } from "google-auth-library";
import { env } from "@/lib/env";

/**
 * トピック分析・意見再抽出バックフィルを実行する Cloud Run Job を起動する。
 *
 * `jobs:run` は実行（Execution）を作成して即座に返るため、重い処理の完了は待たない。
 * 起動の成否のみを呼び出し側に返す（進捗は version / interview_report の状態で追う）。
 *
 * 必須env: GCP_PROJECT_ID, GCP_REGION, GCP_TOPIC_ANALYSIS_JOB, GCP_SA_KEY
 *
 * @param args worker へ渡す引数。例: ["--mode=analyze", "--bill-id=...", "--version-id=..."]
 * @returns 作成された Execution のリソース名
 */
export async function executeTopicAnalysisJob(
  args: string[]
): Promise<{ executionName: string }> {
  const { projectId, region, topicAnalysisJob, serviceAccountKey } = env.gcp;
  if (!projectId || !region || !topicAnalysisJob || !serviceAccountKey) {
    throw new Error(
      "Cloud Run Job のenv（GCP_PROJECT_ID / GCP_REGION / GCP_TOPIC_ANALYSIS_JOB / GCP_SA_KEY）が未設定です"
    );
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch {
    throw new Error("GCP_SA_KEY is not valid JSON");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const accessToken = await auth.getAccessToken();
  if (!accessToken) {
    throw new Error("Failed to obtain GCP access token");
  }

  const url = `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/jobs/${topicAnalysisJob}:run`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    // 起動ごとに引数（mode / bill-id / version-id）を上書きする。
    body: JSON.stringify({
      overrides: { containerOverrides: [{ args }] },
    }),
    // jobs:run は実行作成のみで即返るが、ネットワーク不調でハングしないよう
    // 明示タイムアウト（15s）を付ける。
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to execute Cloud Run job: ${response.status} ${text}`
    );
  }

  const data = (await response.json()) as { name?: string };
  return { executionName: data.name ?? "unknown" };
}
