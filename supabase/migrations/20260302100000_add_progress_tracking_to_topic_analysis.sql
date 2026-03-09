ALTER TABLE topic_analysis_versions
  ADD COLUMN current_step TEXT,
  ADD COLUMN started_at TIMESTAMPTZ,
  ADD COLUMN completed_at TIMESTAMPTZ;
