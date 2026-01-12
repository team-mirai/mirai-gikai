import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/models";

const interviewCtaResultSchema = z.object({
  showInterviewCta: z.boolean(),
  reason: z.enum([
    "user_asked_about_interview",
    "user_shows_expertise",
    "user_wants_to_share_opinion",
    "not_relevant",
  ]),
});

export type InterviewCtaResult = z.infer<typeof interviewCtaResultSchema>;

type DetectInterviewCtaParams = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  billId?: string;
};

/**
 * Detect if the interview CTA should be shown based on conversation context.
 * Uses GPT-4o-mini for fast, low-cost detection.
 *
 * Shows CTA when:
 * - User asks about interviews or how to share their opinion
 * - User demonstrates expertise or domain knowledge
 * - User expresses desire to contribute to the discussion
 */
export async function detectInterviewCta({
  messages,
  billId,
}: DetectInterviewCtaParams): Promise<InterviewCtaResult> {
  // Only check if there's a bill context (interview is per-bill)
  if (!billId) {
    return { showInterviewCta: false, reason: "not_relevant" };
  }

  // Need at least one user message and one assistant response
  if (messages.length < 2) {
    return { showInterviewCta: false, reason: "not_relevant" };
  }

  const conversationText = messages
    .slice(-6) // Only check last 6 messages for efficiency
    .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
    .join("\n");

  const detectorPrompt = `あなたは会話分析システムです。以下の会話を分析し、ユーザーにAIインタビューへの参加を促すべきかどうかを判断してください。

## AIインタビューとは
法案について市民の意見を収集するためのAIインタビュー機能です。ユーザーの専門知識や経験に基づいた意見を聞き取り、レポートとしてまとめます。

## CTAを表示すべき場合
以下のいずれかに該当する場合、showInterviewCta を true にしてください：

1. **user_asked_about_interview**: ユーザーがインタビューや意見共有について質問している
   - 例: 「インタビューって何？」「意見を伝えたい」「どうやって参加できる？」

2. **user_shows_expertise**: ユーザーが専門的な知識や経験を示している
   - 例: 業界経験への言及、専門用語の使用、具体的な事例の提示
   - 例: 「私は医療現場で働いていて...」「10年間この業界にいますが...」

3. **user_wants_to_share_opinion**: ユーザーが意見を述べたい意向を示している
   - 例: 「この法案について思うことがある」「私の考えを聞いてほしい」

## CTAを表示すべきでない場合
- 単純な質問や情報収集のみの場合
- 会話が始まったばかりの場合
- ユーザーが否定的・批判的なだけで建設的な意見を持っていない場合

## 注意
- JSON以外のテキストを出力しないでください
- 判断に迷う場合は false にしてください`;

  try {
    const result = await generateText({
      model: AI_MODELS.gpt4o_mini,
      prompt: `${detectorPrompt}\n\n# 会話履歴\n${conversationText}`,
      output: Output.object({ schema: interviewCtaResultSchema }),
    });

    return result.output;
  } catch (error) {
    console.error("Interview CTA detection error:", error);
    return { showInterviewCta: false, reason: "not_relevant" };
  }
}
