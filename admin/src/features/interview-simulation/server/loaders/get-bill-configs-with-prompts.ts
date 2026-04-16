import "server-only";

import {
  findInterviewConfigsByBillId,
  findInterviewQuestionsByConfigId,
} from "@/features/interview-config/server/repositories/interview-config-repository";
import { fetchBillWithContents } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
import { buildDefaultSystemPrompts } from "./build-default-system-prompts";

export interface BillConfigWithPrompt {
  id: string;
  name: string;
  mode: "loop" | "bulk";
  status: "public" | "closed";
  questionsCount: number;
  /** mode に応じて構築した本番相当の system prompt */
  defaultSystemPrompt: string;
}

/**
 * 対象 bill 配下の全 config を、それぞれの「本番相当 system prompt」付きで取得する。
 *
 * 改善版 sim で config を切り替えるための UI 用データ。pre-build しておくことで
 * ドロップダウン変更時に追加の fetch を発生させずに prompt を差し替えられる。
 */
export async function getBillConfigsWithPrompts(
  billId: string
): Promise<BillConfigWithPrompt[]> {
  const [configs, billData] = await Promise.all([
    findInterviewConfigsByBillId(billId),
    fetchBillWithContents(billId),
  ]);

  const bill = {
    name: billData.bill.name,
    bill_content: {
      title: billData.billTitle,
      summary: billData.billSummary,
      content: billData.billContent,
    },
  };

  const questionsByConfigId = await Promise.all(
    configs.map((c) => findInterviewQuestionsByConfigId(c.id))
  );

  return configs.map((config, idx) => {
    const rawQuestions = questionsByConfigId[idx];
    const questions = rawQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      quick_replies: q.quick_replies ?? null,
      follow_up_guide: q.follow_up_guide ?? null,
    }));
    const mode: "loop" | "bulk" = config.mode === "bulk" ? "bulk" : "loop";
    const { currentSystemPrompt } = buildDefaultSystemPrompts({
      bill,
      interviewConfig: {
        themes: config.themes ?? null,
        knowledge_source: config.knowledge_source ?? null,
      },
      questions,
      mode,
    });
    return {
      id: config.id,
      name: config.name,
      mode,
      status: config.status === "public" ? "public" : "closed",
      questionsCount: questions.length,
      defaultSystemPrompt: currentSystemPrompt,
    };
  });
}
