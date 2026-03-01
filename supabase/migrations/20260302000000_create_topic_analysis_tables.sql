-- トピック解析バージョン管理テーブル
CREATE TABLE topic_analysis_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  summary_md TEXT,
  intermediate_results JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bill_id, version)
);

COMMENT ON TABLE topic_analysis_versions IS 'トピック解析のバージョン管理';
COMMENT ON COLUMN topic_analysis_versions.bill_id IS '対象議案ID';
COMMENT ON COLUMN topic_analysis_versions.version IS 'バージョン番号（議案ごとにインクリメント）';
COMMENT ON COLUMN topic_analysis_versions.status IS '解析ステータス: pending, running, completed, failed';
COMMENT ON COLUMN topic_analysis_versions.summary_md IS '全体サマリ（markdown形式）';
COMMENT ON COLUMN topic_analysis_versions.intermediate_results IS '中間結果（デバッグ・参照用）';
COMMENT ON COLUMN topic_analysis_versions.error_message IS 'エラー時のメッセージ';

-- トピックテーブル
CREATE TABLE topic_analysis_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES topic_analysis_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description_md TEXT NOT NULL,
  representative_opinions JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE topic_analysis_topics IS 'トピック解析で抽出されたトピック';
COMMENT ON COLUMN topic_analysis_topics.version_id IS '所属バージョンID';
COMMENT ON COLUMN topic_analysis_topics.name IS 'トピック名';
COMMENT ON COLUMN topic_analysis_topics.description_md IS 'トピックの説明文（markdown形式）';
COMMENT ON COLUMN topic_analysis_topics.representative_opinions IS '代表的な意見（JSON配列、最大5件）';
COMMENT ON COLUMN topic_analysis_topics.sort_order IS '表示順';

-- 分類テーブル（opinion → topic の多対多）
CREATE TABLE topic_analysis_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES topic_analysis_versions(id) ON DELETE CASCADE,
  interview_report_id UUID NOT NULL REFERENCES interview_report(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topic_analysis_topics(id) ON DELETE CASCADE,
  opinion_index INTEGER NOT NULL,
  UNIQUE(version_id, interview_report_id, topic_id, opinion_index)
);

COMMENT ON TABLE topic_analysis_classifications IS '意見とトピックの分類（多対多）';
COMMENT ON COLUMN topic_analysis_classifications.version_id IS '所属バージョンID';
COMMENT ON COLUMN topic_analysis_classifications.interview_report_id IS 'インタビューレポートID';
COMMENT ON COLUMN topic_analysis_classifications.topic_id IS 'トピックID';
COMMENT ON COLUMN topic_analysis_classifications.opinion_index IS 'レポート内の意見インデックス';

-- インデックス
CREATE INDEX idx_topic_analysis_versions_bill_id ON topic_analysis_versions(bill_id);
CREATE INDEX idx_topic_analysis_topics_version_id ON topic_analysis_topics(version_id);
CREATE INDEX idx_topic_analysis_classifications_version_id ON topic_analysis_classifications(version_id);
CREATE INDEX idx_topic_analysis_classifications_topic_id ON topic_analysis_classifications(topic_id);

-- RLS
ALTER TABLE topic_analysis_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_analysis_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_analysis_classifications ENABLE ROW LEVEL SECURITY;

-- updated_at 自動更新トリガー
CREATE TRIGGER set_topic_analysis_versions_updated_at
  BEFORE UPDATE ON topic_analysis_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
