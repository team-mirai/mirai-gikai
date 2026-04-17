import type { OriginalInterviewSnapshot } from "../types";

/**
 * 過去のインタビューレポート + 会話ログから、
 * シミュ用ペルソナを抽出する LLM への指示プロンプトを構築する純粋関数
 *
 * 出力フォーマットは personaSchema (Zod) で受ける。
 */
export function buildPersonaExtractorPrompt(
  original: OriginalInterviewSnapshot
): string {
  const opinionsBlock =
    original.opinions.length > 0
      ? original.opinions
          .map((o, i) => `${i + 1}. ${o.title}\n   ${o.content}`)
          .join("\n")
      : "（意見の抽出なし）";

  const conversationBlock =
    original.conversation.length > 0
      ? original.conversation
          .map((m) => {
            const label =
              m.role === "interviewer" ? "インタビュアー" : "インタビュイー";
            return `[${label}] ${m.content}`;
          })
          .join("\n")
      : "（会話ログなし）";

  return `あなたはインタビューシミュレーションのためのペルソナ設計者です。
過去に実施された 1 件のインタビューから、そのインタビュイーを再現するための「ペルソナ・キャラクターシート」を構造化データとして抽出してください。

## 元レポート情報
- 立場（短縮）: ${original.roleTitle ?? "（不明）"}
- 立場（詳細）: ${original.roleDescription ?? "（不明）"}
- スタンス: ${original.stance ?? "（不明）"}
- 主張サマリ: ${original.summary ?? "（不明）"}

## 抽出された主な意見
${opinionsBlock}

## 元の会話ログ（インタビュアーとの実際のやりとり）
${conversationBlock}

## 抽出ルール
1. **元レポートと整合させる**: stance / role_title / role_description は元レポートの内容を尊重してください
2. **会話ログから推定する**: speaking_style / typical_response_length / knowledge_level / boundaries は実際の発話パターンから推定してください
3. **物語として一貫性を持たせる**: background は「なぜこの人はこういう意見を持つのか」が短く伝わる一文にしてください
4. **再現性のあるシートを目指す**: 後段でこのペルソナをもとに別のインタビュアーとロールプレイをするので、ペルソナ自身の行動原理が明確に書かれていることが重要です
5. **元レポートにない事実は捏造しない**: 詳細はあえて抽象化してでも、元データから外れないこと
6. **message_to_politicians**: 元レポートの summary / opinions を根拠に、このペルソナが**今回の法案に関して政治家へ最終的に伝えたい核心メッセージ**を **3〜5 件の文字列配列** で返してください。各項目は 1 文で、項目間で意味的に独立させること（後段の満足度評価が項目ごとに引き出せたかを判定する）。スタンスの結論 / 主な懸念 / 要望 / その根拠となる立場 を組み合わせ、**具体的で検証可能な内容**にしてください（抽象論だけにしない）。

スキーマに従って 1 件のオブジェクトを返してください。`;
}
