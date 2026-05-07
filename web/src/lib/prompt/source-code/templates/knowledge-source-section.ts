/**
 * 入力が空ならセクションごと省略する（プロンプト上に空の <knowledge_source> が残ると
 * モデルが「空＝知識なし」と推論するのを避けるため）。
 */
export function buildKnowledgeSourceSection(knowledgeSource: string): string {
  const trimmed = knowledgeSource.trim();
  if (!trimmed) return "";
  return `
## 補足ナレッジ
記事には記載されていない、この議案に関する補足情報です。回答時に参考にしてください。

<knowledge_source>
${trimmed}
</knowledge_source>
`;
}
