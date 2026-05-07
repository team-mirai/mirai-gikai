import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
} from "@mirai-gikai/shared/interview-prompts/types";

interface BuildPersonaFromBillPromptParams {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  /** 立場ヒント。指定時は LLM にこのスタンスで生成させる */
  stanceHint?: "for" | "against" | "neutral";
  /** 立場・属性の自由記述ヒント。指定時は LLM にこの役割像で生成させる */
  roleHint?: string;
}

const STANCE_LABEL: Record<"for" | "against" | "neutral", string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
};

/**
 * 法案内容からシミュ用ペルソナを生成させるプロンプトを構築する純粋関数。
 *
 * 過去の完了インタビューがない場合（レポート 0 件）でもシミュレートできるよう、
 * 法案内容・インタビューテーマ・任意のスタンス/役割ヒントから、インタビュー
 * されそうな「もっともらしい当事者像」を LLM に組み立てさせる。
 */
export function buildPersonaFromBillPrompt(
  params: BuildPersonaFromBillPromptParams
): string {
  const { bill, interviewConfig, stanceHint, roleHint } = params;

  const billName = bill?.name || "";
  const billTitle = bill?.bill_content?.title || "";
  const billSummary = bill?.bill_content?.summary || "";
  const billContent = bill?.bill_content?.content || "";
  const themes = interviewConfig?.themes || [];
  const knowledgeSource = bill?.knowledge_source || "";

  const stanceLine = stanceHint
    ? `- **スタンス（必須）**: ${STANCE_LABEL[stanceHint]}（stance フィールドは "${stanceHint}" にしてください）`
    : "- **スタンス**: 法案の内容と、想定される役割から自然に導かれる立場を選んでください。for/against/neutral から適切なものを選択";

  const trimmedRoleHint = roleHint?.trim() ?? "";
  const hasRoleHint = trimmedRoleHint.length > 0;
  const roleLine = hasRoleHint
    ? `- **役割・属性（必須・最優先）**: ユーザー指定の役割像「**${trimmedRoleHint}**」を必ず採用してください。role_title / role_description はこのヒントに忠実に従って具体化してください。ヒントを別の属性へ言い換えたり、勝手に職種を置き換えたりすることは禁止です。`
    : "- **役割・属性**: 法案の影響を直接受けそうな当事者を想定してください。抽象的すぎる「国民全体」のような設定は避け、具体的な生活・業務文脈を持たせてください";

  return `あなたはインタビューシミュレータのための「当事者ペルソナ」を組み立てる設計者です。
以下の法案について、実際にインタビューされそうな**もっともらしい 1 人の当事者**のキャラクターシートを作ってください。

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

## 生成ルール
${stanceLine}
${roleLine}
- **knowledge_level**: この属性の人が法案についてどの程度事前に知っているかを推定（beginner / intermediate / expert）
- **speaking_style**: 話し方の特徴を 1〜2 文で。例: 「短く端的」「業界用語を混ぜて丁寧」「具体例を挙げながら淡々と」
- **background**: なぜこの立場・スタンスを取るのかが伝わる 200 文字以内のバックグラウンド。実際にありそうな生活・業務文脈を含めること
- **key_concerns**: 法案について特に気にしている論点を 3〜5 件。抽象論ではなく、その立場の人が実感ベースで語れる具体論点
- **typical_response_length**: short / medium / long から選ぶ。この属性の人がインタビューで見せるであろう典型的な回答長
- **boundaries**: 答えたくない・話題を避けそうな領域があれば記載。なければ空配列
- **message_to_politicians**: このペルソナが今回の法案に関して政治家へ最終的に伝えたい核心メッセージを **3〜5 件の文字列配列** で。各項目は 1 文で完結し、項目間で意味的に独立させること（後段の満足度評価が項目ごとに引き出せたかを判定する）。内容としては、スタンスの結論 / 主な懸念 / 要望 / その立場特有の根拠 を組み合わせて、**具体的で検証可能**にする（抽象論のみは避ける）。

${
  hasRoleHint
    ? `## 重要
- **ユーザー指定の役割ヒントが最優先**。上の「役割・属性」指示に忠実であること。ヒントが「一般市民」「専業主婦」のような一見抽象的な属性でも、具体的な生活文脈（住んでいる地域 / 家族構成 / 日常で法案の影響を受けそうな場面 など）を肉付けしてリアルな 1 人に仕立てれば OK
- スタンスと役割は法案内容と矛盾しない範囲で現実的に。例: 規制される側が「規制緩和に賛成」は不自然
- インタビュアーからの質問に**実感ベース**で答えられる人物にすること`
    : `## 重要
- 「全国民を代表する一般市民」「中立的な分析者」のような抽象キャラは避け、**具体的な職種・生活文脈**を持つ 1 人の人物にすること
- スタンスと役割は法案内容と矛盾しない範囲で現実的に。例: 規制される側が「規制緩和に賛成」は不自然
- インタビュアーからの質問に**実感ベース**で答えられる人物にすること`
}`;
}
