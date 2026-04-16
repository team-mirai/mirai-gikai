import type { PersonaCharacterSheet, SimulatedTurn } from "../schemas";
import type { OriginalInterviewSnapshot } from "../types";

interface BuildJudgePromptParams {
  persona: PersonaCharacterSheet;
  original: OriginalInterviewSnapshot;
  currentSimulation: {
    interviewerSystemPrompt: string;
    transcript: SimulatedTurn[];
  };
  improvedSimulation: {
    interviewerSystemPrompt: string;
    transcript: SimulatedTurn[];
  };
}

function formatTranscript(turns: SimulatedTurn[]): string {
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
 * 2 つのシミュレーション結果を比較評価するための AI Judge プロンプトを構築する純粋関数。
 *
 * judgeVerdictSchema (Zod) の構造に従って 1 件のオブジェクトを返させる。
 */
export function buildJudgePrompt(params: BuildJudgePromptParams): string {
  const { persona, original, currentSimulation, improvedSimulation } = params;

  return `あなたは「インタビュープロンプトの改善版が本当に良くなったか」を厳格に評価する AI Judge です。

## 評価対象
同じペルソナに対して、現行プロンプトと改善版プロンプトでそれぞれ 1 本ずつインタビューをシミュレートしました。
両者を比較し、どちらが優れているかを評価してください。

## 比較対象のペルソナ
- 立場: ${persona.role_title} / ${persona.role_description}
- スタンス: ${persona.stance}
- 知識レベル: ${persona.knowledge_level}
- 話し方: ${persona.speaking_style}
- 気にしている論点: ${persona.key_concerns.join(" / ")}

## 元の実インタビュー（参考: このペルソナはここから抽出された）
${formatOriginalConversation(original)}

---

## 現行プロンプト (current) のシステムプロンプト
<system_prompt_current>
${currentSimulation.interviewerSystemPrompt}
</system_prompt_current>

## 現行プロンプトでのシミュレート結果
${formatTranscript(currentSimulation.transcript)}

---

## 改善版プロンプト (improved) のシステムプロンプト
<system_prompt_improved>
${improvedSimulation.interviewerSystemPrompt}
</system_prompt_improved>

## 改善版プロンプトでのシミュレート結果
${formatTranscript(improvedSimulation.transcript)}

---

## 評価軸
以下 5 軸でそれぞれ current / improved を 1〜5 で採点してください。各軸の意味は厳守してください:

1. **question_diversity（質問の多様性）**: 質問パターンが偏っていないか、似た言い回しを繰り返していないか
2. **depth_of_followup（深掘りの質）**: ユーザーの回答に対して有意義な深掘りができているか。深掘りすべきところで素通りしていないか
3. **flow_naturalness（会話の自然さ）**: 不自然な転換や唐突なトピック変更がないか
4. **question_coverage（事前定義質問のカバレッジ）**: インタビュアーが取り上げるべきトピックがどの程度網羅されているか
5. **persona_consistency（ペルソナ一貫性メタ評価）**: シミュレートされたインタビュイーがペルソナ設定から逸脱していないか（このスコアは「シミュ自体の信頼性」の指標として両者同じになることが多い）

## 出力ルール
- スキーマに従って 1 件のオブジェクトを返す
- summary は 200 文字以内で、改善版の長所と懸念をバランス良く書く
- key_differences は 3〜5 件の箇条書きで、両者の具体的な差を述べる
- winner は 1〜4 軸の総合判定。tie は本当に差がない場合のみに限る（迷ったらどちらかを選ぶ）
- concerns は「改善版を本番投入する前に確認すべき懸念」。なければ空配列`;
}
