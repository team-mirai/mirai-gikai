import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
} from "@mirai-gikai/shared/interview-prompts/types";

export interface DiversePlanSlotInput {
  /** 既存の stanceHint。指定があれば planner はそのスタンスに合致する役割を選ぶ */
  stanceHint?: "for" | "against" | "neutral";
}

interface BuildDiverseRolesPlanPromptParams {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  /** 役割を割り当てる必要があるスロット（順序保持。出力もこの順序で返ってくる前提） */
  slotsToPlan: DiversePlanSlotInput[];
  /** ユーザーが既に手動指定した role hints。planner にはこれらと重複しないよう促す */
  preassignedRoleHints?: string[];
}

const STANCE_LABEL: Record<"for" | "against" | "neutral", string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
};

/**
 * 「多様な当事者像 N 件」を 1 回の LLM 呼び出しで計画させるプロンプト。
 *
 * 各スロットを独立に generatePersonaFromBill で生成すると、似たような
 * 「一般市民」風ペルソナに収束しがちなため、事前に多様性を担保する。
 */
export function buildDiverseRolesPlanPrompt(
  params: BuildDiverseRolesPlanPromptParams
): string {
  const { bill, interviewConfig, slotsToPlan, preassignedRoleHints } = params;

  const billName = bill?.name || "";
  const billTitle = bill?.bill_content?.title || "";
  const billSummary = bill?.bill_content?.summary || "";
  const billContent = bill?.bill_content?.content || "";
  const themes = interviewConfig?.themes || [];
  const knowledgeSource = interviewConfig?.knowledge_source || "";

  const slotLines = slotsToPlan
    .map((slot, i) => {
      const idx = i + 1;
      if (slot.stanceHint) {
        return `- スロット ${idx}: スタンス指定=${STANCE_LABEL[slot.stanceHint]}（このスタンスに合致する当事者像を選ぶこと）`;
      }
      return `- スロット ${idx}: スタンス指定なし（役割から自然に導かれるスタンスを選ぶ）`;
    })
    .join("\n");

  const preassignedSection =
    preassignedRoleHints && preassignedRoleHints.length > 0
      ? `\n\n## 既にユーザーが手動指定した役割（参考。重複させないこと）\n${preassignedRoleHints
          .map((h) => `- ${h}`)
          .join("\n")}`
      : "";

  return `あなたはインタビューシミュレータの設計者です。
以下の法案について、**多様な視点を引き出す ${slotsToPlan.length} 人の当事者**を選定してください。
出力した role / stance は後段で 1 人ずつのキャラクターシート生成に使われます。

## 法案情報
- 法案名: ${billName}
- 法案タイトル: ${billTitle}
- 法案要約: ${billSummary}

法案詳細:
<bill_detail>
${billContent}
</bill_detail>

知識ソース:
<knowledge_source>
${knowledgeSource || "（知識ソース未設定）"}
</knowledge_source>

## インタビューテーマ
${themes.length > 0 ? themes.map((t: string) => `- ${t}`).join("\n") : "（テーマ未設定）"}

## 計画対象のスロット（${slotsToPlan.length} 件）
${slotLines}${preassignedSection}

## 多様性のルール（重要）
- **同じような立場の人を重複させない**。職種・年齢層・地域・利害関係・利用シーンなどの軸で意図的に散らす
- 抽象的な「一般市民」「国民全体」「中立的な分析者」のような像は禁止。具体的な生活・業務文脈を持つ 1 人にする
- 法案の影響を直接受けそうな当事者（規制される側 / 規制によって守られる側 / 運用する側 / 周辺で間接的に影響を受ける側 等）から多面的に選ぶ
- スタンス指定がないスロットでは、全体としてスタンスが偏らないよう調整する（賛成・反対・中立を意図的に混ぜる）
- スタンス指定があるスロットは、その指定に矛盾しない当事者像を選ぶ
- 既にユーザー手動指定の役割がある場合は、それと重複しない別軸の当事者を選ぶ

## 出力フォーマット
- \`roles\` は **入力の slotsToPlan と同じ件数（${slotsToPlan.length} 件）・同じ順序** で返すこと
- 各要素は \`role_hint\`（端的な役割名）/ \`stance\`（自然なスタンス）/ \`rationale\`（選定理由 1〜2 文）

各 role_hint は後段で 1 人のキャラクターシートに肉付けされるため、抽象論ではなく**具体的な当事者像のキーワード**にすること。`;
}
