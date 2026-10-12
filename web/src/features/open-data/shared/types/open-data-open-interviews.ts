export type OpenDataOpenInterviewItem = {
  billId: string;
  /** 議案の正式名称 */
  billName: string;
  /** わかりやすいタイトル（難易度別コンテンツ由来） */
  title: string;
  /** 議案の概要（難易度別コンテンツ由来） */
  summary: string;
  /** 議案のサムネイル画像URL。未設定の場合は null */
  thumbnailUrl: string | null;
  /** インタビューの目安時間（分）。未設定の場合は null */
  estimatedDurationMinutes: number | null;
  /** インタビューページの絶対URL */
  interviewUrl: string;
  /** インタビュー設定の作成日時 */
  createdAt: string;
};

export type OpenDataOpenInterviewsResult = {
  items: OpenDataOpenInterviewItem[];
};
