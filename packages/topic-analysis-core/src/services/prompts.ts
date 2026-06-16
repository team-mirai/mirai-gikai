import type { BillContext, FinalTopicWithId } from "../shared/types";
import { toInlineText } from "../utils/to-inline-text";

/** fine 粒度方針（§A.1）。Phase1/2 共通。 */
const GRANULARITY_POLICY = `## トピック粒度の方針（fine）
- 同じ核となる主張をしていれば、具体例・言い回し・根拠・強度が違っても積極的に同じトピックにまとめる。1件しか入らない孤立トピックは極力作らない。
- ただし主張の方向性・対象分野・論点が明確に異なる場合は別トピックにする。粗い数個の大テーマに束ねず、論点の違いが見える中粒度を保つ。
- トピック数は事前に決めず、意見の多様性に応じて自然に決める。
- 「その他」「その他の意見」「分類不能」等の総括トピックは作らない。
- タイトルは意見群の核心となる「主張」を1文で書く。「〜すべきだ」「〜が必要だ」「〜を懸念する」「〜を求める」等の主張文体にし、20字以内。
  - **体言止め・名詞止め（「〜の確保」「〜の明確化」「〜の迅速化」等）で終わらせない。** 必ず述語で締める。
  - 複数の論点を「〜と〜」「〜および〜」で詰め込まない。1つの主張に絞る（悪い例:「被災者支援の公平性確保と生活再建の速度化」→ 良い例:「被災者支援を公平かつ迅速に行うべきだ」）。
  - 抽象的な名詞句ではなく、読んだ人がひと目で何を主張しているか分かる文にする。
- 説明（description_points）は対象意見群の要点を **最大3個の箇条書き** で示す。1要素＝1つの要点（1文）に分け、平文の段落にまとめない。
  - 各要素は1文で簡潔に（40字程度を目安）、必ず述語で締める。**体言止め・名詞止め（「〜という期待。」「〜という懸念。」「〜への対応。」等）で終わらせない**（例:「〜を懸念する声がある。」「〜が指摘されている。」「〜を求める意見がある。」）。
  - 「・」「-」「*」等の箇条書き記号や番号は付けず、文だけを各要素に入れる（記号は表示側で付与する）。
  - 余計な装飾や引用を盛り込まず、論点の核を端的に述べる。
  - 記述例（description_points の3要素）:
    ["防災大臣の勧告権に強制力がなく、実効性を懸念する声がある。", "大規模災害時には省庁間調整が機能しないリスクが指摘されている。", "勧告レベルや対応基準の事前明確化を求める意見がある。"]
- 公開されるため、特定発言の原文をそのまま転記しない・個人名等の固有名詞を含めない（引用は短い言い回しに留める）。`;

function buildBillContextText(bill: BillContext): string {
  const body = bill.body ?? bill.summary ?? "";
  return `## 議案
議案名: ${bill.name}
本文/概要:
${body.slice(0, 4000)}`;
}

/** Phase1 一次抽出プロンプト */
export function buildExtractPrompt(
  bill: BillContext,
  opinionsText: string
): string {
  return `あなたは議案に対する市民の意見を分析する専門家です。

${buildBillContextText(bill)}

${GRANULARITY_POLICY}

## 意見一覧
${opinionsText}

## タスク
上記の意見一覧に現れる論点（主張）を fine 粒度で抽出してください。すべての意見を網羅する必要はありません（紐づかない意見があってよい）。`;
}

/** Phase2 統合プロンプト */
export function buildMergePrompt(
  bill: BillContext,
  candidatesText: string
): string {
  return `あなたは議案に対する市民の意見を分析する専門家です。

${buildBillContextText(bill)}

${GRANULARITY_POLICY}

## トピック候補一覧
${candidatesText}

## タスク
上記は意見バッチごとに抽出したトピック候補です。重複・近接するトピックを統合し、議案全体で一貫した最終トピック集合にまとめてください。「その他」等の総括トピックが含まれていたら除去してください。`;
}

/** Phase3 割当プロンプト（TSV 出力・§A.2） */
export function buildAssignPrompt(
  bill: BillContext,
  finalTopics: FinalTopicWithId[],
  opinionsText: string
): string {
  const topicsText = finalTopics
    .map((t) => `${t.local_id}: ${t.title} — ${toInlineText(t.description)}`)
    .join("\n");
  return `あなたは議案分析の専門家です。各意見を適切なトピックに割り当ててください。

## 議案
${bill.name}

## トピック一覧
${topicsText}

## 意見一覧
${opinionsText}

## タスク
各意見をトピックに割り当て、**TSV形式で1行ずつ**出力してください。形式は「意見番号<TAB>トピックID」です（例: \`1\tt0\`）。

ルール:
- タイトル・主張の方向性が明確に一致するトピックにだけ割り当てる。「なんとなく関連」では割り当てない。
- 明確に一致するトピックが無ければトピックIDは \`null\` とする。
- 1意見につき割り当てるトピックは1つまで。
- 提示した全ての意見番号について1行ずつ出力する。
- TSV以外の説明文は出力しない。`;
}

/**
 * 増分分析の差分判定プロンプト。
 * 新規意見から抽出した候補のうち、既存トピックのどれとも明確に異なり粒度も適切なものだけを
 * 「新規トピックとして採用」する。曖昧なものは採用しない（既存へ吸収させる）。
 */
export function buildJudgeNewTopicsPrompt(
  bill: BillContext,
  existingTopicsText: string,
  candidatesText: string
): string {
  return `あなたは議案に対する市民の意見を分析する専門家です。

${buildBillContextText(bill)}

${GRANULARITY_POLICY}

## 既存トピック（すでに存在する。これらと重複する候補は新規作成しない）
${existingTopicsText}

## 新規トピック候補（新しく増えた意見から抽出したもの）
${candidatesText}

## タスク
各「新規トピック候補」について、**新規トピックとして採用するか**を判定し、採用する候補の番号を返してください。

採用基準（すべて満たす場合のみ採用）:
- 既存トピックのいずれとも、主張の方向性・対象分野・論点が **明確に異なる**。
- fine 粒度の方針に合致する（粗すぎ・細かすぎでない）。

不採用にする（番号を返さない）ケース:
- 既存トピックのいずれかと実質同じ／包含される。
- 粒度が不適切。
- **採用すべきか判断が曖昧な場合も不採用にする**（トピックの乱立を防ぐため、迷ったら作らない）。

不採用の候補に紐づく意見は、後段で既存トピックへ割り当てられるため、ここで無理に新規作成しないこと。`;
}
