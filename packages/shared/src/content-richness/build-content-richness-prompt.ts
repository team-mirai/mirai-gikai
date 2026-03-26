import { buildContentRichnessInstructions } from "./content-richness-instructions";

type Message = {
  role: string;
  content: string;
};

type BuildContentRichnessPromptParams = {
  summary: string | null;
  opinions: Array<{ title: string; content: string }> | null;
  roleDescription: string | null;
  messages: Message[];
};

/**
 * 情報充実度の再評価用プロンプトを構築する
 */
export function buildContentRichnessPrompt(
  params: BuildContentRichnessPromptParams
): string {
  const parts: string[] = [];

  if (params.messages.length > 0) {
    const messagesText = params.messages
      .map((m) => `[${m.role}] ${m.content}`)
      .join("\n");
    parts.push(`## 会話ログ\n${messagesText}`);
  }

  if (params.summary) {
    parts.push(`## レポート要約\n${params.summary}`);
  }

  if (params.opinions && params.opinions.length > 0) {
    const opinionsText = params.opinions
      .map((o, i) => `${i + 1}. ${o.title}\n   ${o.content}`)
      .join("\n");
    parts.push(`## 意見\n${opinionsText}`);
  }

  if (params.roleDescription) {
    parts.push(`## 回答者の背景\n${params.roleDescription}`);
  }

  const contentToEvaluate =
    parts.length > 0 ? parts.join("\n\n") : "（内容なし）";

  return `あなたはAIインタビューで収集された市民意見の情報充実度を評価する専門家です。

以下のインタビューの会話ログおよびレポート内容を評価し、法案検討にどれだけ活かせる情報が得られたかを判定してください。

## 評価対象コンテンツ
${contentToEvaluate}

${buildContentRichnessInstructions()}`;
}
