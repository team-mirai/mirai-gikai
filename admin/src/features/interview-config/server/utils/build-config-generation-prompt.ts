import "server-only";

import type { ConfigGenerationStage } from "../../shared/schemas";

interface ExistingQuestion {
  question: string;
  follow_up_guide?: string | null;
  quick_replies?: string[] | null;
}

interface BuildPromptParams {
  billName: string;
  billTitle: string;
  billSummary: string;
  billContent: string;
  stage: ConfigGenerationStage;
  confirmedThemes?: string[];
  knowledgeSource?: string;
  existingThemes?: string[];
  existingQuestions?: ExistingQuestion[];
}

export function buildConfigGenerationPrompt(params: BuildPromptParams): string {
  const {
    billName,
    billTitle,
    billSummary,
    billContent,
    stage,
    confirmedThemes,
    knowledgeSource,
    existingThemes,
    existingQuestions,
  } = params;

  const billSection = `## 法案情報
- 法案名: ${billName}
- タイトル: ${billTitle}
- 要約: ${billSummary}
- 詳細内容:
${billContent}`;

  const knowledgeSection = knowledgeSource?.trim()
    ? `\n## ナレッジソース（チームの仮説や補足情報）\n${knowledgeSource}\n`
    : "";

  const baseRole = `あなたは、市民インタビューの設計を支援する専門家です。
法案に関する市民の意見を効果的に収集するためのインタビューテーマと質問を提案します。
管理者と対話しながら、より良いインタビュー設定を一緒に作り上げてください。`;

  if (stage === "theme_proposal") {
    const existingThemesSection =
      existingThemes && existingThemes.length > 0
        ? `\n## 現在設定されているテーマ\n${existingThemes.map((t) => `- ${t}`).join("\n")}\n\n管理者は既存のテーマのブラッシュアップを希望しています。既存テーマを踏まえて改善提案をしてください。`
        : "";

    return `${baseRole}

${billSection}
${knowledgeSection}${existingThemesSection}
## あなたの役割
この法案について、市民インタビューで扱うべきテーマを3〜5個提案してください。

## テーマ提案のガイドライン
- 法案の主要論点をカバーする
- 市民の生活や仕事への影響に関連する
- 賛否両論を引き出せるテーマにする
- 具体的かつ分かりやすい表現にする
- ナレッジソースがある場合は、その情報も考慮してテーマを設計する

## 出力形式
- text: 提案の概要説明（なぜこれらのテーマを選んだかを簡潔に）
- themes: テーマの配列（3〜5個）

管理者からの修正要望があれば、それに応じてテーマを調整してください。
修正する場合は、修正後の全テーマを themes に含めてください。`;
  }

  if (stage === "question_proposal") {
    const themesSection = confirmedThemes
      ? `## 確定テーマ\n${confirmedThemes.map((t) => `- ${t}`).join("\n")}`
      : "## テーマ\n（テーマ未設定）";

    const existingQuestionsSection =
      existingQuestions && existingQuestions.length > 0
        ? `\n## 現在設定されている質問\n${existingQuestions.map((q, i) => `${i + 1}. ${q.question}${q.follow_up_guide ? `\n   フォローアップ指針: ${q.follow_up_guide}` : ""}${q.quick_replies?.length ? `\n   選択肢: ${q.quick_replies.join(", ")}` : ""}`).join("\n")}\n\n管理者は既存の質問のブラッシュアップを希望しています。既存質問を踏まえて改善提案をしてください。`
        : "";

    return `${baseRole}

${billSection}
${knowledgeSection}
${themesSection}${existingQuestionsSection}

## あなたの役割
確定したテーマに基づいて、インタビュー質問を提案してください。

## 質問提案のガイドライン

### ラポール形成・専門知識レベル確認（最初の1〜2問）
質問リストの最初に、ラポール形成と専門知識レベルの確認を目的とした質問を1〜2問配置してください。
これらの質問は、インタビュー冒頭で回答者との信頼関係を築き、どの程度の専門知識を持っているかを把握するためのものです。
以下の観点を含めてください:
- 法案との関わり（例: 「この法案のテーマについて、どのような関わりがありますか？」）
- 日々の業務・生活との関係（例: 「普段のお仕事や暮らしの中で、この分野とどの程度関係がありますか？」）
- 知識レベルの確認（例: 「この分野について、どの程度ご存知ですか？」）
これらの質問にも適切なクイックリプライを付けてください（例: 「専門的に関わっている」「業務で関係がある」「暮らしに影響がある」「一般市民として関心がある」等）。
follow_up_guideには「回答内容から専門知識レベルを判断し、以降の質問の深さや用語の使い方を調整してください」といったフォローアップ指針を含めてください。

### 本題の質問（ラポール形成質問の後）
- 各テーマから少なくとも1つの質問を作成する
- ラポール形成質問と合わせて合計5〜8個の質問を提案する
- 自由回答を促す開かれた質問にする
- 各質問に適切なクイックリプライ（3〜5個）を用意する
- 必要に応じてフォローアップ指針を添える
- ナレッジソースがある場合は、その情報も踏まえた質問にする

## 各質問に含めるフィールド
- question: 質問文（分かりやすく端的に）
- follow_up_guide: フォローアップ指針（任意、回答後の深掘り方法や注意点など）
- quick_replies: クイックリプライの選択肢（任意、3〜5個）

## 出力形式
- text: 提案の概要説明（質問の構成意図など）
- questions: 質問オブジェクトの配列

管理者からの修正要望があれば、それに応じて質問を調整してください。
修正する場合は、修正後の全質問を questions に含めてください。`;
  }

  return baseRole;
}
