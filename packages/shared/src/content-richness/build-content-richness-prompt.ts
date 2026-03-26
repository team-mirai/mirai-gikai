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

## 評価観点

以下の5つの観点でそれぞれ0-100の整数で評価してください：

1. **total（総合）**: 総合的な情報充実度。以下4観点の重み付き総合評価
2. **clarity（明確さ）**: 論点の明確さ — 議論のポイントがはっきり浮かび上がっているか
3. **specificity（具体性）**: 現場の実感や具体的な事例・数値が得られたか
4. **impact（影響への言及）**: 社会的影響や関係者への影響について情報が得られたか
5. **constructiveness（提案の広がり）**: 課題の指摘に加え、改善の方向性や代替案が含まれているか

## スコアリング基準
- **80-100**: 非常に充実 — 具体的な事例・数値・影響分析・改善提案が豊富に含まれている
- **60-79**: 充実 — 主要な論点が明確で、一定の具体性・提案がある
- **40-59**: 普通 — 基本的な意見は述べられているが、具体性や深掘りが不足
- **20-39**: やや不足 — 意見が抽象的で、法案検討に活用しづらい
- **0-19**: 不足 — ほとんど有用な情報が得られていない

## reasoning（評価根拠）
上記スコアの根拠を100文字以内で簡潔に説明してください。`;
}
