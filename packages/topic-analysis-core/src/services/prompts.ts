import type { BillContext, FinalTopicWithId } from "../shared/types";

/** fine 粒度方針（§A.1）。Phase1/2 共通。 */
const GRANULARITY_POLICY = `## トピック粒度の方針（fine）
- 同じ核となる主張をしていれば、具体例・言い回し・根拠・強度が違っても積極的に同じトピックにまとめる。1件しか入らない孤立トピックは極力作らない。
- ただし主張の方向性・対象分野・論点が明確に異なる場合は別トピックにする。粗い数個の大テーマに束ねず、論点の違いが見える中粒度を保つ。
- トピック数は事前に決めず、意見の多様性に応じて自然に決める。
- 「その他」「その他の意見」「分類不能」等の総括トピックは作らない。
- タイトルは「〜すべきだ」「〜が必要だ」「〜を求める」等の主張文体で20字以内。
- 説明は対象意見群を要約する自然な文章にする（80〜150字程度・複数文可）。
  - **体言止め・名詞止め（「〜という期待。」「〜という懸念。」「〜への対応。」等）で終わらせない。** 必ず述語で締める（例:「〜が中心。」「〜という声が語られている。」「〜が浮かび上がる。」「〜が求められている。」）。
  - 論点の核を述べたうえで、代表的な声・具体的な経験、制度と現場の乖離などの示唆に触れるとよい（例:「復職時の処遇低下や配置転換への懸念が中心。『戻る場所がない』『評価から外された』といった具体的経験が語られ、制度上の建前と現場運用の乖離が浮かび上がる。」）。
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
    .map((t) => `${t.local_id}: ${t.title} — ${t.description}`)
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
