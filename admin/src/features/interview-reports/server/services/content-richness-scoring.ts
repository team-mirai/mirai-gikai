import "server-only";

import { generateObject } from "ai";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { contentRichnessResultSchema } from "@mirai-gikai/shared/content-richness/schemas";
import { buildContentRichnessPrompt } from "@mirai-gikai/shared/content-richness/build-prompt";
import { parseOpinions } from "../../shared/utils/parse-opinions";
import {
  findInterviewMessagesBySessionId,
  findReportForModerationScoringById,
  updateContentRichness,
} from "../repositories/interview-report-repository";

/**
 * 単一レポートに対して情報充実度の再評価を実行する
 */
export async function runSingleContentRichnessScoring(
  reportId: string
): Promise<{ total: number }> {
  const report = await findReportForModerationScoringById(reportId);

  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  const messages = await findInterviewMessagesBySessionId(
    report.interview_session_id
  );

  const prompt = buildContentRichnessPrompt({
    summary: report.summary,
    opinions: parseOpinions(report.opinions),
    roleDescription: report.role_description,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const { object } = await generateObject({
    model: DEFAULT_INTERVIEW_CHAT_MODEL,
    schema: contentRichnessResultSchema,
    prompt,
  });

  await updateContentRichness(reportId, object);

  console.log(
    `[SingleContentRichness] report=${reportId} total=${object.total}`
  );

  return { total: object.total };
}
