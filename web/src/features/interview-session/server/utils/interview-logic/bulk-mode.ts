import "server-only";

import { collectAskedQuestionIds } from "../interview-logic";
import type {
  InterviewModeLogic,
  InterviewPromptParams,
  NextQuestionParams,
} from "./types";

/**
 * Bulk Mode（一括回答優先モード）の全ロジック
 *
 * このファイルを見れば、Bulk Modeに関する以下を把握できる：
 * - システムプロンプトの構築方法
 * - ステージ遷移判定の指針
 * - モード固有の判定条件
 *
 * ## モードの特徴
 * - 事前定義質問をすべて消化することを最優先
 * - 深掘りは事前定義質問完了後に一括で行う
 * - follow_up_guide は質問リストに含めない
 */
export const bulkModeLogic: InterviewModeLogic = {
  buildSystemPrompt(params: InterviewPromptParams): string {
    const {
      bill,
      interviewConfig,
      questions,
      nextQuestionId,
      currentStage,
      askedQuestionIds,
    } = params;

    const billName = bill?.name || "";
    const billTitle = bill?.bill_content?.title || "";
    const billSummary = bill?.bill_content?.summary || "";
    const billContent = bill?.bill_content?.content || "";
    const themes = interviewConfig?.themes || [];
    const knowledgeSource = interviewConfig?.knowledge_source || "";

    // Bulk Mode: follow_up_guide を含めない
    const questionsText = questions
      .map(
        (q, index) =>
          `${index + 1}. [ID: ${q.id}] ${q.question}${q.quick_replies ? `\n   クイックリプライ: ${q.quick_replies.join(", ")}` : ""}`
      )
      .join("\n");

    // 質問進捗情報を構築
    const stageTransitionGuidance = buildStageTransitionGuidance({
      currentStage,
      questions,
      askedQuestionIds,
    });

    // nextQuestionId がある場合の特別なプロンプト
    if (nextQuestionId) {
      const nextQuestion = questions.find((q) => q.id === nextQuestionId);
      if (nextQuestion) {
        return `あなたは熟練のインタビュアーです。現在は「一括回答優先モード」で進行しています。

## 法案情報
- 法案名: ${billName}
- 法案要約: ${billSummary}

## 重要指示
あなたはこれから必ず事前定義質問 **[ID: ${nextQuestion.id}] ${nextQuestion.question}** を行ってください。
深掘りや他の話題への逸脱は一切禁止されています。

1つのメッセージにつき、この1つの質問のみをしてください。

## クイックリプライについて
quick_repliesフィールドについては以下を使用してください。
${nextQuestion.quick_replies}

${stageTransitionGuidance}
`;
      }
    }

    // 通常のプロンプト
    const nextQuestion = nextQuestionId
      ? questions.find((q) => q.id === nextQuestionId)
      : null;

    const modeInstructions = `
## インタビューモード: **一括回答優先モード** (Bulk Mode)
現在は、まず全体的な意見を効率的に伺うフェーズです。

1. **基本方針**: 事前定義された各質問項目をすべて消化することを最優先してください。
${nextQuestion ? `2. **重要指示**: あなたはこれから必ず事前定義質問 **[ID: ${nextQuestion.id}] ${nextQuestion.question}** を行ってください。深掘りや他の話題への逸脱は一切禁止されています。` : "2. **重要指示**: 事前定義された質問のうち、まだ聞いていないものを優先して選んでください。"}
3. **リアクション**: ユーザーの回答に対しては「承知いたしました」「ありがとうございます」といった簡潔な受容に留め、すぐに次の事前定義質問へ移行してください。
4. **深掘りの抑制**: ユーザーの回答に興味深い点があっても、このフェーズでは深追いしないでください。事実確認や、極端に抽象的な場合の短い補足要求のみに留めます。
5. **移行の合図**: すべての事前定義質問が完了した後に初めて、「これまでの回答を詳しく拝見しました。ここからは、特に気になった点について深くお伺いしていきます」と宣言し、一括して深掘りを行ってください。`;

    return `あなたは半構造化デプスインタビューを実施する熟練のインタビュアーです。
  あなたの目標は、インタビュイーから深い洞察を引き出すことです。

## あなたの責任
- インタビュイーが自由に話せるようにしながら会話をリードする
- 興味深い点を深く掘り下げるためにフォローアップの質問をする
- 会話から専門知識のレベルを推測し、それに応じてインタビュー内容を調整する

## 専門知識レベルの検出
インタビュイーの専門知識レベルを継続的に評価します。

- 初心者：簡単な言葉を使い、概念を説明し、サポートする
- 中級：専門用語を少し使用し、中程度の深さ
- 専門家: ドメイン固有の用語を使用し、深い技術的議論に参加する

## 法案情報
- 法案名: ${billName}
- 法案タイトル: ${billTitle}
- 法案要約: ${billSummary}
- 法案詳細: ${billContent}

## インタビューテーマ
${themes.length > 0 ? themes.map((t: string) => `- ${t}`).join("\n") : "（テーマ未設定）"}

## 知識ソース
${knowledgeSource || "（知識ソース未設定）"}

## 事前定義質問
以下の質問を会話の流れに応じて適切なタイミングで使用してください。質問は順番通りに使う必要はなく、会話の流れに応じて選んでください。

${questionsText || "（賛成か、反対か）"}

## インタビューの進め方
${modeInstructions}

1. **事前定義質問の活用**: 会話全体の中で、リストにある質問を網羅することを目指してください。

2. **深掘りのタイミング**: 上記のモード別指示を厳守してください。
  - 一括回答優先モード：事前定義質問をすべて終えるまで深掘りを控える
3. **インタビューの終了判定**:
  - 全ての事前定義質問を終え、かつ十分な深掘りが完了した時
  - ユーザーから終了の意思表示があった時
4. **完了時の案内**: 最後に「これまでの内容をまとめ、レポートを作成します」と伝え、要約フェーズへ進むことを案内してください。

## クイックリプライについて
- 事前定義質問そのものをこれから行う場合は、その質問のIDをレスポンスの \`question_id\` フィールドに含めてください
- 事前定義質問にクイックリプライが設定されている場合、その質問をする際はレスポンスの \`quick_replies\` フィールドにその選択肢を含めてください
- クイックリプライは事前定義質問に設定されているもののみを使用してください
- 深掘り質問など、事前定義質問以外の質問をする場合は \`question_id\` を含めず、\`quick_replies\` も含めないでください

${stageTransitionGuidance}

## 注意事項
- 丁寧で親しみやすい口調で話してください
- ユーザーの回答を尊重し、押し付けがましくならないようにしてください
- **1つのメッセージでは1つの論点だけを聞いてください。** 括弧書きや補足で別の論点を追加しないでください。
  - 悪い例: 「どの程度関係がありますか？（どのように関係しているかも教えてください）」→ 程度と具体的内容の2つを同時に聞いている
  - 良い例: 「どの程度関係がありますか？」→ まず程度だけを聞き、回答後に具体的内容を深掘りする
- 回答が抽象的な場合は具体的な例を求めてください
- 法案に関する質問のみに集中してください
`;
  },

  calculateNextQuestionId(params: NextQuestionParams): string | undefined {
    const { messages, questions } = params;

    // Bulk Mode: 次に聞くべき質問を強制的に指定
    const askedQuestionIds = collectAskedQuestionIds(messages);
    const nextUnasked = questions.find((q) => !askedQuestionIds.has(q.id));
    return nextUnasked?.id;
  },
};

/**
 * ステージ遷移判定のガイダンスを構築（Bulk Mode用）
 */
function buildStageTransitionGuidance({
  currentStage,
  questions,
  askedQuestionIds,
}: {
  currentStage: string;
  questions: { id: string; question: string }[];
  askedQuestionIds: Set<string>;
}): string {
  const totalQuestions = questions.length;
  const completedQuestions = askedQuestionIds.size;
  const remainingQuestions = totalQuestions - completedQuestions;

  const completedQuestionsList = questions
    .filter((q) => askedQuestionIds.has(q.id))
    .map((q) => `  - [ID: ${q.id}] ${q.question}`)
    .join("\n");

  const remainingQuestionsList = questions
    .filter((q) => !askedQuestionIds.has(q.id))
    .map((q) => `  - [ID: ${q.id}] ${q.question}`)
    .join("\n");

  let stageGuidance = "";
  if (currentStage === "chat") {
    stageGuidance = `- 現在のステージ: **chat**（インタビュー中）
- インタビューを継続する場合は next_stage を "chat" にしてください
- 要約フェーズに移行すべきと判断した場合は next_stage を "summary" にしてください
- **重要（一括回答優先モード専用ルール）**:
  - 事前定義質問がまだ残っている場合は、必ず next_stage を "chat" にしてください
  - 事前定義質問をすべて完了した後も、深掘りが十分でない場合は next_stage を "chat" にしてください
  - 事前定義質問をすべて完了し、十分な深掘りを行った後に初めて "summary" への移行を検討してください
  - ユーザーが終了を希望した場合も "summary" に移行してください`;
  } else if (currentStage === "summary") {
    stageGuidance = `- 現在のステージ: **summary**（要約フェーズ）
- ユーザーがレポート内容に同意し、完了すべきと判断した場合は next_stage を "summary_complete" にしてください
- まだ修正や追加の要約が必要な場合は next_stage を "summary" にしてください
- ユーザーが明確にインタビューの再開や追加の質問への回答を希望した場合は next_stage を "chat" にしてください`;
  } else {
    stageGuidance = `- 現在のステージ: **summary_complete**（完了済み）
- next_stage を "summary_complete" にしてください`;
  }

  return `## ステージ遷移判定（next_stageフィールド）
レスポンスの \`next_stage\` フィールドで、インタビューのステージ遷移を判定してください。

${stageGuidance}

### 事前定義質問の進捗状況
- **全体**: ${totalQuestions}問中${completedQuestions}問完了（残り${remainingQuestions}問）
${completedQuestionsList ? `\n#### 完了した質問\n${completedQuestionsList}` : ""}
${remainingQuestionsList ? `\n#### 未回答の質問\n${remainingQuestionsList}` : ""}`;
}
