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
    const q1 = DEFAULT_QUESTIONS_TEMPLATE.find(
      (e) => e.kind === "generated" && e.slot === "q1"
    );
    const q2 = DEFAULT_QUESTIONS_TEMPLATE.find(
      (e) => e.kind === "generated" && e.slot === "q2"
    );
    if (q1?.kind !== "generated" || q2?.kind !== "generated") {
      throw new Error("Template slots q1/q2 not found");
    }

    return `${baseRole}

${billSection}
${knowledgeSection}
## あなたの役割
この法案に合わせた **Q1（関心のあるテーマの選択）** と **Q2（立場・関わり方）** の質問を生成してください。
それ以外の質問は固定のテンプレートを使うため、あなたはこの2問のみ出力してください。

## Q1 サンプル（あくまで参考。法案に合わせて適切に差し替えること）
- 質問文: ${q1.sample_question}
- フォローアップ指針: ${q1.sample_follow_up_guide}
- クイックリプライ例: ${q1.sample_quick_replies.join(" / ")}

## Q2 サンプル（あくまで参考。法案に合わせて適切に差し替えること）
- 質問文: ${q2.sample_question}
- フォローアップ指針: ${q2.sample_follow_up_guide}
- クイックリプライ例: ${q2.sample_quick_replies.join(" / ")}

## 生成ガイドライン
- **Q1**: 回答者がこの法改正の中で「特に関係がある / 意見を伝えたい」テーマを1つ選ぶための質問。
  - クイックリプライは、法案の主要論点の中から、市民が関心を持ちそうなテーマを5件抽出する。
  - 論点は法案の内容に固有のもの（条文・制度・対象など）とし、抽象論にしない。
  - フォローアップ指針には「選んだテーマはQ5で深掘りする」「1つに絞ってもらう」「迷う場合は一番関心が強いものを選ぶ」を含める。
- **Q2**: インタビュー冒頭のラポール形成と回答者の立場把握が目的。この法案にどのように関わっているか（仕事・生活・サービス利用など）を短く聞く形にする。
  - クイックリプライは、この法案の影響を受けそうな立場・属性を5件挙げる（「一般市民として関心がある」のような汎用枠を1つ含めること）。
  - フォローアップ指針には「回答から専門知識レベルを判断し以降の深さや用語を調整する」旨と、この法案ならではの深掘り例を必ず含める。
- クイックリプライは必ず5件、各20文字以内を目安に簡潔に。
- **クイックリプライに括弧書きの補足（例: 「データ消失（障害・ランサム等）」「権利内容の改ざん（記載の書き換え）」）は使わない**。選択肢は単一の短い語句のみ。補足が必要な内容は、選択肢を分けるかフォローアップ指針で深掘りする方針にする。

## 出力形式
- text: 生成意図の短い説明（このQ1・Q2がなぜこの法案に適しているか）
- q1: { question, follow_up_guide, quick_replies }
- q2: { question, follow_up_guide, quick_replies }`;
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
- 必要に応じてフォローアップ指針を添える
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
        ? `\n## 確定済みの質問\n${confirmedQuestions.map((q, i) => `${i + 1}. ${q.question}${q.quick_replies?.length ? `\n   選択肢: ${q.quick_replies.join(", ")}` : ""}`).join("\n")}\n`
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
