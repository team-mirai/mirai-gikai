// ユーザー向けトピック分析の読み取り（公開）API のデータ契約（設計 §13 付録 A.4）。

/** §9 の4区分。interview_report.role を 1:1 でマップする。 */
export type UserCategory = "affected" | "industry" | "expert" | "citizen";

/** 公開 API が返す意見カード（§8 フィルタ後のもののみ）。 */
export type PublicOpinion = {
  id: string;
  /** この意見の出典インタビューレポートID（レポート詳細への遷移に使う）。 */
  interview_report_id: string;
  /**
   * 出典レポートが管理者公開済みか（is_public_by_admin）。
   * レポート詳細ページは管理者公開かつ公開件数しきい値を満たす場合のみ表示されるため、
   * リンク表示の出し分けに使う（§8 表示判定は user 同意・モデレーションのみ）。
   */
  report_public: boolean;
  /** 出典レポートの作成日時（相対表示・日付表示に使う）。 */
  created_at: string | null;
  title: string;
  content: string;
  user_category: UserCategory;
  /** 発言者の立場の短縮タイトル（interview_report.role_title）。引用の属性表示に使う。 */
  role_title: string | null;
  bill_sentiment: "期待" | "懸念" | null;
  contextual_quote: string | null;
  /**
   * 意見単位の情報充実度（0-100）。引用の優先表示・並べ替えに使う（集計には使わない）。
   * 旧データ・未生成は null。
   */
  richness: number | null;
  /** 引用の出典メッセージID。レポート詳細の該当メッセージ（#message-<id>）へ遷移するのに使う。 */
  source_message_id: string | null;
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
  interview_report_id: string;
  created_at: string | null;
  title: string;
  content: string;
  contextual_quote: string | null;
  source_message_id: string | null;
  bill_sentiment: string | null;
  /** 意見単位の情報充実度（0-100・nullable）。引用の優先表示・並べ替えに使う。 */
  richness: number | null;
  is_public_by_user: boolean;
  is_public_by_admin: boolean;
  moderation_status: string | null;
  role: string | null;
  role_title: string | null;
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

// ── 回答一覧（回答者1人=1カード）の表示データ ──

/** 回答一覧カード1件（公開レポート＝回答者1人）。 */
export type PublicRespondent = {
  /** 出典インタビューレポートID（レポート詳細への遷移に使う）。 */
  id: string;
  user_category: UserCategory;
  /** 発言者の立場の短縮タイトル（interview_report.role_title）。 */
  role_title: string | null;
  /** 賛否（for=期待 / against=懸念 / それ以外=null）。 */
  bill_sentiment: "期待" | "懸念" | null;
  /** レポートの要約テキスト（カード本文に表示）。 */
  summary: string | null;
  /** 出典レポートの作成日時（相対表示・日付表示に使う）。 */
  created_at: string | null;
};

/** リポジトリが返す生のレポート行（回答一覧用・pure 関数の入力）。 */
export type RawRespondentRow = {
  id: string;
  role: string | null;
  role_title: string | null;
  stance: string | null;
  summary: string | null;
  created_at: string | null;
};
