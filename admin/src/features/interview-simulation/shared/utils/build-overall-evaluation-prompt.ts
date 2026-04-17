import type {
  IntervieweeSatisfaction,
  PersonaCharacterSheet,
} from "../schemas";

export interface OverallEvaluationSlotInput {
  personaIndex: number;
  persona: PersonaCharacterSheet;
  satisfaction: IntervieweeSatisfaction | null;
}

interface BuildOverallEvaluationPromptParams {
  slots: OverallEvaluationSlotInput[];
}

const COVERAGE_LABEL: Record<
  IntervieweeSatisfaction["message_coverage"],
  string
> = {
  covered: "ほぼ網羅",
  partial: "一部のみ",
  not_covered: "ほぼ未達",
};

/**
 * 全ペルソナの満足度評価を横断して、インタビュー設定全体の評価を LLM にまとめさせる
 * プロンプトを構築する純粋関数。
 */
export function buildOverallEvaluationPrompt(
  params: BuildOverallEvaluationPromptParams
): string {
  const slotsBlock =
    params.slots.length > 0
      ? params.slots
          .map((s) => {
            const sat = s.satisfaction;
            const satBlock = sat
              ? [
                  `   満足度: ${sat.score} / 5（${COVERAGE_LABEL[sat.message_coverage]}）`,
                  `   根拠: ${sat.summary}`,
                  sat.uncovered_points.length > 0
                    ? `   掘り残し: ${sat.uncovered_points.map((p) => `・${p}`).join(" / ")}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n")
              : "   満足度: （評価失敗）";
            const messageBlock =
              s.persona.message_to_politicians.length > 0
                ? s.persona.message_to_politicians
                    .map((m) => `   - ${m}`)
                    .join("\n")
                : "   - （未設定）";
            return [
              `${s.personaIndex + 1}. ${s.persona.role_title}（${s.persona.stance}）`,
              "   伝えたかったこと:",
              messageBlock,
              satBlock,
            ].join("\n");
          })
          .join("\n\n")
      : "（評価対象のペルソナなし）";

  return `あなたはインタビュー設計のメタ評価者です。
以下は、同じインタビュー設定を複数のペルソナに対して並列シミュレートした結果です。
各ペルソナが「伝えたかったこと」をどれだけ引き出せたかのスコアと根拠が付いています。
これらを横断して、**このインタビュー設定が複数の当事者を相手にしたときの強み / 取りこぼし / 改善余地** を評価してください。

## 各ペルソナの満足度
${slotsBlock}

## 評価ルール
- **インタビュー設定（質問 / テーマ / 深掘り方針）そのものを評価**する視点で書いてください。特定 1 ペルソナの詳細に引きずられず、複数スロットを横断して共通する傾向を抽出してください
- **verdict の目安**
  - excellent: どのペルソナも高スコア（平均 4.5 以上）で、伝えたいことがほぼ引き出されている
  - good: 主要な論点は概ねカバーできている（平均 3.5〜4.5）
  - fair: 一部のペルソナで掘り残しが目立つ（平均 2.5〜3.5）
  - poor: 多くのペルソナで伝えきれていない（平均 2.5 未満）
- **common_strengths**: 複数ペルソナに共通して引き出せていた点。具体的な質問意図やテーマ設計の効いた部分
- **common_gaps**: 複数ペルソナに共通して取りこぼされた論点。uncovered_points に繰り返し現れるパターンを抽出
- **improvement_suggestions**: インタビュー設定（質問追加 / 質問言い換え / 深掘り方針の変更 / テーマ調整など）への具体的な改善提案。抽象論（「もっと深掘りする」）は避け、**どこをどう変えるか**まで含めること

スキーマに従って 1 件のオブジェクトを返してください。`;
}
