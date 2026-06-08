-- ユーザー向けトピック分析機能の土台となる interview_opinion テーブルを作成
-- interview_report.opinions(JSONB) を正本とし、本テーブルはそこから導出する
-- 正規化プロジェクション（読み取りモデル）。dual-write で同期する（§3.1）。
-- opinion_id(UUID) を安定させるため、同期は delete+insert ではなく
-- ON CONFLICT (interview_report_id, opinion_index) DO UPDATE で行う。

CREATE TABLE interview_opinion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_report_id UUID NOT NULL REFERENCES interview_report(id) ON DELETE CASCADE,
  opinion_index SMALLINT NOT NULL,              -- レポート内の順序（0..2）
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_message_id UUID,                        -- 元発言の引用が紐づくメッセージ
  contextual_quote TEXT,                         -- 文脈込み引用（自己完結。§4.0）
  bill_sentiment TEXT,                           -- '期待' | '懸念' | NULL
  richness INTEGER,                              -- 任意（無ければ report 側の total_content_richness を使う）
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (interview_report_id, opinion_index)
);

-- レポート単位の同期・分析対象抽出のためのインデックス
CREATE INDEX idx_interview_opinion_report_id ON interview_opinion(interview_report_id);

-- Enable Row Level Security
ALTER TABLE interview_opinion ENABLE ROW LEVEL SECURITY;

-- No policies are created, so all access is denied by default
-- Access will only be possible using Supabase Service Role Key from server-side

-- Add comments for documentation
COMMENT ON TABLE interview_opinion IS 'interview_report.opinions(JSONB)から導出する意見の正規化プロジェクション（トピック分析用の読み取りモデル）';
COMMENT ON COLUMN interview_opinion.interview_report_id IS '元レポートID';
COMMENT ON COLUMN interview_opinion.opinion_index IS 'レポート内の意見の順序（0始まり）';
COMMENT ON COLUMN interview_opinion.title IS '意見のタイトル';
COMMENT ON COLUMN interview_opinion.content IS '意見の説明';
COMMENT ON COLUMN interview_opinion.source_message_id IS '根拠となるユーザー発言のメッセージID';
COMMENT ON COLUMN interview_opinion.contextual_quote IS '文脈込みの自己完結した引用（個人名等の固有名詞は含めない）';
COMMENT ON COLUMN interview_opinion.bill_sentiment IS '法案に対する期待/懸念（期待|懸念|NULL）';
COMMENT ON COLUMN interview_opinion.richness IS '意見単位の情報充実度（任意）';
