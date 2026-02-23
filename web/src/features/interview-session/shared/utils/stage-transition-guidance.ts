/**
 * ステージ遷移ガイダンスを構築する純粋関数
 *
 * server/utils/interview-logic/ のモードファイルから呼び出される。
 * テスタビリティのため shared/ に配置。
 */

interface StageTransitionParams {
  currentStage: string;
  questions: { id: string; question: string }[];
  askedQuestionIds: Set<string>;
}

interface TimeManagementParams {
  remainingMinutes: number | null | undefined;
  remainingQuestions: number;
}

/**
 * タイムマネジメントガイダンスを構築する
 *
 * remainingMinutesがnull/undefinedの場合は空文字列を返す（時間制限なし）
 */
export function buildTimeManagementGuidance({
  remainingMinutes,
  remainingQuestions,
}: TimeManagementParams): string {
  if (remainingMinutes == null) return "";

  const isTimeUp = remainingMinutes <= 0;

  if (isTimeUp) {
    return `## タイムマネジメント
- **目安時間を超過しています**
- 残り事前質問数: ${remainingQuestions}問
- ユーザーがレポート作成に進みたいと言った場合は、速やかに next_stage を "summary" にしてください
- ユーザーがインタビューを続けたい場合は、深掘りを控えめにして効率的に進めてください`;
  }

  return `## タイムマネジメント
- 残り目安時間: 約${remainingMinutes}分
- 残り事前質問数: ${remainingQuestions}問
- 残り時間と残り質問数のバランスを意識してください
- 残り時間が少なく質問が多い場合: 深掘りを控えめにし、次の質問に進むことを優先してください
- 残り時間に余裕があり質問が少ない場合: より深い掘り下げが可能です`;
}

/**
 * 質問の進捗状況を計算する
 */
function calculateProgress(
  questions: { id: string }[],
  askedQuestionIds: Set<string>
) {
  const totalQuestions = questions.length;
  // askedQuestionIds に questions 外のIDが含まれる可能性があるため、
  // questions 側でフィルタして正確にカウントする
  const completedQuestions = questions.filter((q) =>
    askedQuestionIds.has(q.id)
  ).length;
  const remainingQuestions = totalQuestions - completedQuestions;
  return { totalQuestions, completedQuestions, remainingQuestions };
}

/**
 * 完了/未回答の質問リストを構築する
 */
function buildQuestionLists(
  questions: { id: string; question: string }[],
  askedQuestionIds: Set<string>
) {
  const completedQuestionsList = questions
    .filter((q) => askedQuestionIds.has(q.id))
    .map((q) => `  - [ID: ${q.id}] ${q.question}`)
    .join("\n");

  const remainingQuestionsList = questions
    .filter((q) => !askedQuestionIds.has(q.id))
    .map((q) => `  - [ID: ${q.id}] ${q.question}`)
    .join("\n");

  return { completedQuestionsList, remainingQuestionsList };
}

/**
 * Bulk Mode 用のステージ遷移ガイダンスを構築
 */
export function buildBulkModeStageGuidance({
  currentStage,
  questions,
  askedQuestionIds,
}: StageTransitionParams): string {
  const { totalQuestions, completedQuestions, remainingQuestions } =
    calculateProgress(questions, askedQuestionIds);
  const { completedQuestionsList, remainingQuestionsList } = buildQuestionLists(
    questions,
    askedQuestionIds
  );

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

/**
 * Loop Mode 用のステージ遷移ガイダンスを構築
 */
export function buildLoopModeStageGuidance({
  currentStage,
  questions,
  askedQuestionIds,
}: StageTransitionParams): string {
  const { totalQuestions, completedQuestions, remainingQuestions } =
    calculateProgress(questions, askedQuestionIds);
  const { completedQuestionsList, remainingQuestionsList } = buildQuestionLists(
    questions,
    askedQuestionIds
  );

  let stageGuidance = "";
  if (currentStage === "chat") {
    stageGuidance = `- 現在のステージ: **chat**（インタビュー中）
- インタビューを継続する場合は next_stage を "chat" にしてください
- 要約フェーズに移行すべきと判断した場合は next_stage を "summary" にしてください
- 事前定義質問を概ね完了し、十分な深掘りを行った場合に "summary" への移行を検討してください
- ユーザーが終了を希望した場合も "summary" に移行してください
- これ以上の深掘りが難しい場合も "summary" に移行してください
- **重要（都度深掘りモード）**: 事前定義質問の消化を急がないでください。現在のテーマについて十分な深掘り（2〜3回のフォローアップ）が完了するまで、次の事前定義質問に移らないでください。以下の進捗状況は参考情報であり、全問消化よりも各テーマの深掘りを優先してください`;
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
