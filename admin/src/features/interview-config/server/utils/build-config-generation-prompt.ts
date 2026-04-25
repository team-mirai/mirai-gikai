import "server-only";

import type { ConfigGenerationStage } from "../../shared/schemas";
import { DEFAULT_QUESTIONS_TEMPLATE } from "../../shared/utils/default-questions-template";

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
  knowledgeSource?: string;
  existingThemes?: string[];
  existingQuestions?: ExistingQuestion[];
  confirmedQuestions?: ExistingQuestion[];
}

export function buildConfigGenerationPrompt(params: BuildPromptParams): string {
  const {
    billName,
    billTitle,
    billSummary,
    billContent,
    stage,
    knowledgeSource,
    existingThemes,
    existingQuestions,
    confirmedQuestions,
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

  if (stage === "default_questions") {
    const topicsEntry = DEFAULT_QUESTIONS_TEMPLATE.find(
      (e) => e.kind === "quick_replies_slot" && e.slot === "topics"
    );
    const stanceEntry = DEFAULT_QUESTIONS_TEMPLATE.find(
      (e) => e.kind === "quick_replies_slot" && e.slot === "stance"
    );
    if (
      topicsEntry?.kind !== "quick_replies_slot" ||
      stanceEntry?.kind !== "quick_replies_slot"
    ) {
      throw new Error("Template slots topics/stance not found");
    }

    return `${baseRole}

${billSection}
${knowledgeSection}
## あなたの役割
この法案に合わせた **2種類のクイックリプライ選択肢** を生成してください。
質問文・フォローアップ指針は固定テンプレートを使うため、あなたは選択肢配列だけ出力します。

## 出力する2種類
1. \`topics\`（Q1 で使う「関心のあるテーマ／論点」の選択肢）
   - 対応する質問: 「${topicsEntry.question}」
   - **論点・テーマ名**を並べる（例: 「AI利用」「罰則」「データ保護」のような条文・制度・対象の名前）
   - 立場や属性は絶対に入れない。
2. \`stance\`（Q2 で使う「立場・関わり方」の選択肢）
   - 対応する質問: 「${stanceEntry.question}」
   - **立場・属性**を並べる（例: 「仕事で〜」「〜の利用者」「〜の保護者」のような人の属性を表す語）
   - 論点・テーマは絶対に入れない。
   - 汎用枠として「一般市民として関心がある」を必ず1件含める。

**特に重要**: \`topics\` と \`stance\` を絶対に取り違えないこと。次のサンプル出力のどちらがどちらか照合してから出力してください。

## サンプル（あくまで参考。法案に合わせて差し替えること）
- topics サンプル（論点）: ${topicsEntry.sample_quick_replies.join(" / ")}
- stance サンプル（立場）: ${stanceEntry.sample_quick_replies.join(" / ")}

## 生成ガイドライン
- \`topics\`: 法案の主要論点の中から、市民が関心を持ちそうなテーマを5件。論点は法案の内容に固有のもの（条文・制度・対象など）とし、抽象論にしない。
- \`stance\`: この法案の影響を受けそうな立場・属性を5件。「一般市民として関心がある」を1件必ず含める。
- 各スロットとも5件挙げること（末尾の「その他（自由記述）」はコード側で自動付与するため**出力に含めない**）。
- 選択肢は各20文字以内を目安に簡潔に。
- **括弧書きの補足（例: 「データ消失（障害・ランサム等）」）は使わない**。選択肢は単一の短い語句のみ。

## 出力形式
- text: 生成意図の短い説明
- topics: string[] （論点の選択肢、5件）
- stance: string[] （立場の選択肢、5件）`;
  }

  if (stage === "question_proposal") {
    const existingQuestionsSection =
      existingQuestions && existingQuestions.length > 0
        ? `\n## 現在設定されている質問\n${existingQuestions.map((q, i) => `${i + 1}. ${q.question}${q.follow_up_guide ? `\n   フォローアップ指針: ${q.follow_up_guide}` : ""}${q.quick_replies?.length ? `\n   選択肢: ${q.quick_replies.join(", ")}` : ""}`).join("\n")}\n\n管理者は既存の質問のブラッシュアップを希望しています。既存質問を踏まえて改善提案をしてください。`
        : "";

    return `${baseRole}

${billSection}
${knowledgeSection}${existingQuestionsSection}

## あなたの役割
管理者の要望に沿って、インタビュー質問をブラッシュアップしてください。

## 質問提案のガイドライン
- **1つの質問には必ず1つの問いだけを含めること**。複数の論点を1つの質問文に詰め込まない。
- 自由回答を促す開かれた質問にする
- 各質問にクイックリプライ（3〜5個）を用意するのが望ましい
- **クイックリプライに括弧書きの補足（例: 「データ消失（障害・ランサム等）」）は使わない**。選択肢は単一の短い語句（20文字以内目安）のみ。補足が必要ならフォローアップ指針側に記載する。
- フォローアップ指針は深掘り過剰を避ける: 連鎖的な深掘りを指示せず、「1往復までの追加確認に留める」「回答を受け止めたら次の質問に進む」方針を含めること。
- ナレッジソースがある場合は、その情報も踏まえた質問にする

## 各質問に含めるフィールド
- question: 質問文（1つの問いに絞り、分かりやすく端的に）
- follow_up_guide: フォローアップ指針（任意、回答後の深掘り方法や注意点など）
- quick_replies: クイックリプライの選択肢（任意、3〜5個）

## 出力形式
- text: 提案の概要説明（調整意図など）
- questions: 質問オブジェクトの配列（修正後の全質問を必ず含めること）`;
  }

  if (stage === "theme_proposal") {
    const confirmedQuestionsSection =
      confirmedQuestions && confirmedQuestions.length > 0
        ? `\n## 確定済みの質問\n${confirmedQuestions.map((q, i) => `${i + 1}. ${q.question}${q.follow_up_guide ? `\n   フォローアップ指針: ${q.follow_up_guide}` : ""}${q.quick_replies?.length ? `\n   選択肢: ${q.quick_replies.join(", ")}` : ""}`).join("\n")}\n`
        : "";

    const existingThemesSection =
      existingThemes && existingThemes.length > 0
        ? `\n## 現在設定されているテーマ\n${existingThemes.map((t) => `- ${t}`).join("\n")}\n\n管理者は既存のテーマのブラッシュアップを希望しています。既存テーマを踏まえて改善提案をしてください。`
        : "";

    return `${baseRole}

${billSection}
${knowledgeSection}${confirmedQuestionsSection}${existingThemesSection}
## あなたの役割
確定済みの質問内容と法案情報をもとに、このインタビューで扱うテーマを提案してください。
テーマは、後段の分析で論点を集計・分類するためのラベルとして使われます。

## テーマ提案のガイドライン
- 確定質問で実際に聞かれている論点を漏れなくカバーする
- 法案の主要論点に対応するテーマにする
- 市民の生活や仕事への影響に関連する
- 具体的かつ分かりやすい表現にする
- 件数は法案内容と質問に応じて3〜6件程度を目安とする（固定ではない）

## 出力形式
- text: 提案の概要説明（なぜこれらのテーマにしたか）
- themes: テーマの配列

管理者からの修正要望があれば、それに応じてテーマを調整してください。
修正する場合は、修正後の全テーマを themes に含めてください。`;
  }

  return baseRole;
}
