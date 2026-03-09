-- フェーズ間データ受け渡し用カラム
ALTER TABLE topic_analysis_versions ADD COLUMN phase_data JSONB;
