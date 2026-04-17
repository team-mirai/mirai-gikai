import type { PersonaCharacterSheet, SimulatedTurn } from "../schemas";

interface BuildIntervieweeSatisfactionPromptParams {
  persona: PersonaCharacterSheet;
  transcript: SimulatedTurn[];
}

/**
 * インタビュイーの満足度を LLM に評価させるプロンプトを構築する純粋関数。
 *
 * 判定基準: persona.message_to_politicians がインタビューの中で
 * どの程度引き出されたかを、会話全体を読んで判定する。
 * 出力は intervieweeSatisfactionSchema で受ける。
 */
export function buildIntervieweeSatisfactionPrompt(
  params: BuildIntervieweeSatisfactionPromptParams
): string {
  const { persona, transcript } = params;

  const transcriptBlock =
    transcript.length > 0
      ? transcript
          .map((t, i) => {
            const label =
              t.role === "interviewer" ? "インタビュアー" : "インタビュイー";
            return `${i + 1}. [${label}] ${t.content}`;
          })
          .join("\n")
      : "（会話ログなし）";

  return `あなたはインタビュー後のインタビュイー本人になりきって、**「自分が伝えたかったことを、このインタビューでどれくらい話せたか」** を評価します。

## ペルソナ
- 立場: ${persona.role_title} — ${persona.role_description}
- スタンス: ${persona.stance}
- 話し方: ${persona.speaking_style}

## インタビュイーが最終的に伝えたかった核心メッセージ（message_to_politicians）
${persona.message_to_politicians.map((m) => `- ${m}`).join("\n")}

## 会話ログ
${transcriptBlock}

## 評価ルール
- **ペルソナの主観で評価**: 客観的な「インタビューの質」ではなく、**このペルソナ本人が満足したか** という視点で採点する
- **network effect を考慮**: 伝えたかった論点がインタビュアーから直接聞かれていなくても、深掘りの中で自発的に言えた場合は「引き出せた」扱いにしてよい
- **部分達成は partial**: 複数論点のうち一部しか触れられなかった場合は partial、主要な点が全て触れられたら covered
- **スコアの目安**
  - 5: 伝えたかったことがほぼ全て会話に登場し、インタビュアーからも受け止められた実感がある
  - 4: 主要な論点は伝わったが、細部や具体例まで掘ってもらえなかった
  - 3: 半分程度。重要な論点がいくつか未達
  - 2: ほとんど伝えられなかった。インタビュアーの関心が別方向だった
  - 1: 伝えたい内容に一度も触れないまま終わった
- **uncovered_points**: message_to_politicians を分解したうえで、会話で触れられなかった具体論点を箇条書きで挙げる（なければ空配列）

スキーマに従って 1 件のオブジェクトを返してください。`;
}
