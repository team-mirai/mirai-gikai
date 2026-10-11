import "server-only";

import { consumeRateLimit } from "@/features/open-data/server/repositories/open-data-repository";
import { getWindowStart } from "@/features/open-data/shared/utils/rate-limit-window";
import {
  ARTICLE_REPORT_FAILED_MESSAGE,
  type SubmitArticleReportResult,
} from "../../shared/types/submit-article-report-result";
import { parseArticleReportInput } from "../../shared/utils/article-report-input";
import {
  buildAdminArticleReportsUrl,
  buildArticleReportSlackMessage,
} from "../../shared/utils/build-article-report-slack-message";
import { canReceiveArticleReport } from "../../shared/utils/can-receive-article-report";
import {
  createArticleReport,
  findBillForArticleReport,
} from "../repositories/article-report-repository";
import type { ArticleReportNotifier } from "../utils/slack-webhook-notifier";

const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_PER_IP = 5;
const RATE_LIMIT_GLOBAL = 100;

const RATE_LIMITED_MESSAGE =
  "送信が多すぎます。しばらく待ってから再度お試しください";
const NOT_REPORTABLE_MESSAGE = "この記事は誤り報告を受け付けていません";

const DEFAULT_RATE_LIMIT_KEY_PREFIX = "article-report";

export type SubmitArticleReportDeps = {
  clientIp: string;
  now: Date;
  adminUrl: string;
  /** 未設定なら通知しない */
  notify?: ArticleReportNotifier;
  rateLimitKeyPrefix?: string;
};

async function consumeArticleReportRateLimit(
  clientIp: string,
  now: Date,
  keyPrefix: string
): Promise<boolean> {
  const windowStart = getWindowStart(
    now,
    RATE_LIMIT_WINDOW_SECONDS
  ).toISOString();

  // IP 制限を通過したリクエストだけが全体枠を消費する
  const ipAllowed = await consumeRateLimit({
    key: `${keyPrefix}:ip:${clientIp}`,
    windowStart,
    limit: RATE_LIMIT_PER_IP,
  });
  if (!ipAllowed) return false;

  return consumeRateLimit({
    key: `${keyPrefix}:global`,
    windowStart,
    limit: RATE_LIMIT_GLOBAL,
  });
}

export async function submitArticleReportCore(
  input: unknown,
  deps: SubmitArticleReportDeps
): Promise<SubmitArticleReportResult> {
  const parsed = parseArticleReportInput(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  const { billId, difficultyLevel, category, body } = parsed.data;

  let billName: string;
  try {
    const allowed = await consumeArticleReportRateLimit(
      deps.clientIp,
      deps.now,
      deps.rateLimitKeyPrefix ?? DEFAULT_RATE_LIMIT_KEY_PREFIX
    );
    if (!allowed) {
      return { ok: false, error: RATE_LIMITED_MESSAGE };
    }

    const bill = await findBillForArticleReport(billId);
    if (!bill || !canReceiveArticleReport(bill)) {
      return { ok: false, error: NOT_REPORTABLE_MESSAGE };
    }
    billName = bill.name;

    await createArticleReport({
      billId,
      difficultyLevel,
      category: category ?? null,
      body,
    });
  } catch (error) {
    console.error("Failed to submit article report:", error);
    return { ok: false, error: ARTICLE_REPORT_FAILED_MESSAGE };
  }

  if (deps.notify) {
    try {
      await deps.notify(
        buildArticleReportSlackMessage({
          billName,
          difficultyLevel,
          category,
          body,
          adminReportsUrl: buildAdminArticleReportsUrl(deps.adminUrl, billId),
        })
      );
    } catch (error) {
      console.error("Failed to notify article report to Slack:", error);
    }
  }

  return { ok: true };
}
