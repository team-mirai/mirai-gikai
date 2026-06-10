// ユーザー向けトピック分析の読み取り（公開）API のデータ契約（設計 §13 付録 A.4）。

/** §9 の4区分。interview_report.role を 1:1 でマップする。 */
export type UserCategory = "affected" | "industry" | "expert" | "citizen";

/** 公開 API が返す意見カード（§8 フィルタ後のもののみ）。 */
export type PublicOpinion = {
  id: string;
  title: string;
  content: string;
  user_category: UserCategory;
  bill_sentiment: "期待" | "懸念" | null;
  contextual_quote: string | null;
  /**
   * 発言を引き出した質問文（source_message_id から導出）。
   * 導出は Q&A 表示を行う Step 4b で実装するため、4a では null 固定。
   */
  question_snippet: string | null;
};

/** 公開 API が返すトピック（件数・内訳は §8 フィルタ後に再計算）。 */
export type PublicTopic = {
  id: string;
  title: string;
  description: string;
  opinion_count: number;
  affected_count: number;
  industry_count: number;
  expert_count: number;
  citizen_count: number;
  sentiment: { 期待: number; 懸念: number };
  opinions: PublicOpinion[];
};

/** 公開 API レスポンス全体（§13 A.4）。 */
export type PublicTopicAnalysis = {
  bill_id: string;
  version: number;
  generated_at: string | null;
  total_opinions: number;
  topics: PublicTopic[];
};

// ── リポジトリが返す生データ（pure 関数の入力） ──

/** §8 判定に必要なレポート属性を相乗した、生の意見行。 */
export type RawOpinionRow = {
  id: string;
  title: string;
  content: string;
  contextual_quote: string | null;
  bill_sentiment: string | null;
  is_public_by_user: boolean;
  moderation_status: string | null;
  role: string | null;
};

/** version 配下の生トピック行（sort_order 昇順）。 */
export type RawTopicRow = {
  id: string;
  title: string;
  description: string;
  opinions: RawOpinionRow[];
};

/** 公開中 version のメタ情報。 */
export type PublishedVersionMeta = {
  bill_id: string;
  version: number;
  generated_at: string | null;
};
