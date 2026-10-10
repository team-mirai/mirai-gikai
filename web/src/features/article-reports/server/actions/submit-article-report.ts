"use server";

import { headers } from "next/headers";
import { getClientIp } from "@/features/open-data/shared/utils/client-ip";
import { env } from "@/lib/env";
import type { SubmitArticleReportResult } from "../../shared/types/submit-article-report-result";
import { submitArticleReportCore } from "../services/submit-article-report-core";
import { createSlackWebhookNotifier } from "../utils/slack-webhook-notifier";

export async function submitArticleReport(input: {
  billId: string;
  difficultyLevel: string;
  category?: string;
  body: string;
}): Promise<SubmitArticleReportResult> {
  const webhookUrl = process.env.ARTICLE_REPORT_SLACK_WEBHOOK_URL;

  return submitArticleReportCore(input, {
    clientIp: getClientIp(await headers()) ?? "unknown",
    now: new Date(),
    adminUrl: env.adminUrl,
    notify: webhookUrl ? createSlackWebhookNotifier(webhookUrl) : undefined,
  });
}
