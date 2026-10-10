import "server-only";

const SLACK_WEBHOOK_TIMEOUT_MS = 5000;

export type ArticleReportNotifier = (text: string) => Promise<void>;

export function createSlackWebhookNotifier(
  webhookUrl: string
): ArticleReportNotifier {
  return async (text) => {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(SLACK_WEBHOOK_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Slack webhook responded with ${response.status}`);
    }
  };
}
