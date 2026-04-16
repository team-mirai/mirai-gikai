import type { SimulatedTurn } from "../schemas";
import type { OriginalInterviewSnapshot } from "../types";

interface BuildJudgeVsOriginalPromptParams {
  original: OriginalInterviewSnapshot;
  improvedSimulation: {
    interviewerSystemPrompt: string;
    transcript: SimulatedTurn[];
    /** 改善版 sim が終わった理由（summary 到達 / max_turns 打ち切り 等） */
    stopReason:
      | "max_turns"
      | "summary"
      | "summary_complete"
      | "interviewer_error"
      | "interviewee_error";
    /** 改善版で聞かれた事前定義質問 ID 数 */
    askedPredefinedCount: number;
    /** 事前定義質問の総数 */
    totalPredefinedCount: number;
  };
}

function formatSimulatedTranscript(turns: SimulatedTurn[]): string {
  if (turns.length === 0) return "（会話なし）";
  return turns
    .map((t) => {
      const label =
        t.role === "interviewer" ? "インタビュアー" : "インタビュイー";
      return `[${label}] ${t.content}`;
    })
    .join("\n");
}

function formatOriginalConversation(
  original: OriginalInterviewSnapshot
): string {
  if (original.conversation.length === 0) return "（会話なし）";
  return original.conversation
    .map((m) => {
      const label =
        m.role === "interviewer" ? "インタビュアー" : "インタビュイー";
      return `[${label}] ${m.content}`;
    })
    .join("\n");
}

/**
 * 「改善版プロンプトでシミュレートしたインタビュアー」を、
 * 「元の実インタビューの実在インタビュアー」と比較評価する AI Judge プロンプト。
 *
 * judgeVsOriginalVerdictSchema の構造で 1 件のオブジェクトを返させる。
 */
export function buildJudgeVsOriginalPrompt(
  params: BuildJudgeVsOriginalPromptParams
): string {
  const { original, improvedSimulation } = params;
  const originalInterviewerTurns = original.conversation.filter(
    (t) => t.role === "interviewer"
  ).length;
  const improvedInterviewerTurns = improvedSimulation.transcript.filter(
    (t) => t.role === "interviewer"
  ).length;
  const improvedReachedSummary =
    improvedSimulation.stopReason === "summary" ||
    improvedSimulation.stopReason === "summary_complete";

  return `あなたはインタビューの質を厳格に評価する AI Judge です。
「改善版プロンプトでシミュレートされたインタビュアーの質問」が、
「元の実インタビューの実在インタビュアーの質問」と比べて、**どの点で良く・どの点で悪く・どの程度違うのか** を評価してください。

## 評価対象の絞り込み（厳守）
- 評価の対象は **インタビュアー側の発話** のみ（質問の質、深掘り、流れ、カバレッジ、自然さ）
- インタビュイー側の発話の質・内容は**評価しない**（元は実在の人物、改善版はシミュレートされた合成ペルソナなので、同じ土俵では比較できない）
- あくまで「インタビュアーとして、元と比べてどう振る舞っているか」に集中する

## 実行メタデータ（評価の前提になる客観データ）
- 元インタビュアーのターン数: **${originalInterviewerTurns}**
- 改善版インタビュアーのターン数: **${improvedInterviewerTurns}**
- 事前定義質問のカバレッジ（改善版）: **${improvedSimulation.askedPredefinedCount} / ${improvedSimulation.totalPredefinedCount}**
- 改善版の終了理由: **${improvedSimulation.stopReason}**（${improvedReachedSummary ? "自然に summary へ遷移できた" : "⚠ summary に到達せず途中で打ち切られた"}）

## 元の実インタビュー（比較基準）
${formatOriginalConversation(original)}

---

## 改善版プロンプトでシミュレートされたインタビュー
<improved_system_prompt>
${improvedSimulation.interviewerSystemPrompt}
</improved_system_prompt>

<improved_transcript>
${formatSimulatedTranscript(improvedSimulation.transcript)}
</improved_transcript>

---

## 評価の観点（重要度順）
1. **事前定義質問のカバレッジ（最重要）**: 元インタビューで聞かれている論点を、改善版でも同じくらい拾えているか。元がカバーしている論点を改善版が取りこぼしているなら、深掘りの質が高くても**減点**。
2. **summary への自然な到達**: 元は自然に要約フェーズまで進んでいる。改善版が \`max_turns\` で途中打ち切りになっているなら、**運用上の欠陥**として重く評価する。
3. **深掘りの質**: ユーザー回答の要点を捉えた follow-up か。ただし「同じ論点を何度も掘り続けて次の質問に進まない」のは深掘りではなく**カバレッジ低下の原因**として扱う。
4. **質問の多様性**: 似たパターンの繰り返しになっていないか。
5. **会話の自然さ**: 唐突な転換や説教調になっていないか。
6. **テンポ**: 元のインタビュー長・粒度から大きく外れていないか。長すぎる・短すぎるどちらも減点。
7. **インタビュアーとしての技量**: 言い換え、感情の受け止め、次の一手の適切さ。

## 判定の目安（厳守）
- 改善版のカバレッジが元より明確に低い（例: 元 4/4 に対し改善版 2/4）**かつ** max_turns で打ち切られている → \`improved_worse\`（深掘りの質で補えない本質的な劣化）
- カバレッジは同等だが深掘りの質や自然さで上回る → \`improved_better\`
- 差が小さい、または良し悪しが相殺される → \`about_same\`
- 「深掘りが上手」だけで \`improved_better\` と判定しない。カバレッジと summary 到達が前提条件。

## 出力ルール
- \`overall_verdict\` は上記「判定の目安」に従って付ける。無理に差を作らない
- \`summary\` は 1〜2 段落、300 文字以内を目安。カバレッジ・summary 到達・深掘りの質のバランスを必ず言及する
- \`improved_strengths\` は「元を超えている具体的な点」、\`improved_weaknesses\` は「元より劣る具体的な点」。カバレッジ低下や打ち切りが weakness に該当するなら必ず列挙する
- 元と変わらない / 同等な場合は、strengths や weaknesses を無理に埋めず空配列で良い
- \`notable_observations\` は他に特筆すべき観察（ターン数の偏り、特定論点の深掘り過多など）`;
}
