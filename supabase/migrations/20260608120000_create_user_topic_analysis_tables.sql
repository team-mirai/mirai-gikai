-- ユーザー向けトピック分析（Step 3）の分析結果テーブル。
-- 既存の admin 用 topic_analysis_versions/_topics/_classifications とは完全に独立（設計§10）。
-- 意見は interview_opinion（正規化プロジェクション）を参照する。

CREATE TYPE topic_analysis_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

-- 分析バージョン（bill 内連番。バージョニングと公開管理の中心。§3.2）
CREATE TABLE topic_analysis_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,                       -- bill 内の連番
  status topic_analysis_status NOT NULL DEFAULT 'pending',
  is_published BOOLEAN NOT NULL DEFAULT false,    -- 公開フラグ（§7。Step4aで制御）

  -- 実行制御（§5 の状態機械）
  current_step TEXT,                              -- 'extract' | 'merge' | 'assign' | 'done'
  progress JSONB,                                 -- フェーズ間の中間結果・進捗

  -- 監査・再現
  trigger TEXT NOT NULL,                          -- 'cron' | 'manual'
  model TEXT,                                     -- 使用モデル
  prompt_version TEXT,                            -- プロンプト版
  source_opinion_count INTEGER,                   -- 分析時点の対象意見数（watermark, §6）

  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (bill_id, version)
);

-- 公開は bill ごとに最大1版（部分ユニークインデックス。§3.2）
CREATE UNIQUE INDEX one_published_per_bill
  ON topic_analysis_version (bill_id) WHERE is_published;

-- 実行中（pending/running）は bill ごとに最大1版（二重起動の原子的ガード・§5.3）。
-- アプリ層の事前チェックは TOCTOU で破れるため、DB 側でも一意制約を持たせる。
CREATE UNIQUE INDEX one_active_version_per_bill
  ON topic_analysis_version (bill_id) WHERE status IN ('pending', 'running');

CREATE INDEX idx_topic_analysis_version_bill ON topic_analysis_version(bill_id);

-- トピック（§3.3）
CREATE TABLE topic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES topic_analysis_version(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                            -- 主張文体・20字程度
  description TEXT NOT NULL,                      -- 論点の説明 60〜80字
  sort_order INTEGER NOT NULL DEFAULT 0,          -- opinion件数降順などの表示順
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topic_version ON topic(version_id);

-- 意見へのトピック割当（§3.4）。1意見は最大1トピック（0 or 1）。未分類は行なし。
CREATE TABLE topic_opinion (
  topic_id UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  opinion_id UUID NOT NULL REFERENCES interview_opinion(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES topic_analysis_version(id) ON DELETE CASCADE,
  PRIMARY KEY (version_id, opinion_id)            -- 1意見最大1トピックを強制
);

CREATE INDEX idx_topic_opinion_topic ON topic_opinion(topic_id);

-- Enable Row Level Security（ポリシーは定義しない＝デフォルト全拒否）
ALTER TABLE topic_analysis_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_opinion ENABLE ROW LEVEL SECURITY;

-- No policies are created, so all access is denied by default.
-- Access is via Supabase Secret Key from server-side only.

COMMENT ON TABLE topic_analysis_version IS 'ユーザー向けトピック分析のバージョン（bill内連番・公開管理の中心）';
COMMENT ON COLUMN topic_analysis_version.is_published IS '公開フラグ。bill毎に最大1版（部分unique）。Step4aで制御';
COMMENT ON COLUMN topic_analysis_version.current_step IS 'extract | merge | assign | done';
COMMENT ON COLUMN topic_analysis_version.progress IS 'フェーズ間の中間結果（抽出候補・最終トピック・割当）';
COMMENT ON COLUMN topic_analysis_version.source_opinion_count IS '分析時点の対象意見数（§8フィルタ後）';
COMMENT ON TABLE topic IS 'トピック（主張文体タイトル＋論点説明）';
COMMENT ON TABLE topic_opinion IS '意見→トピックの割当（version スコープ・1意見最大1トピック）';
