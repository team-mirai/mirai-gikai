-- interview_sessionsテーブルにarchived_atカラムを追加
-- セッションをアーカイブ（やり直し）した場合に設定される
ALTER TABLE interview_sessions ADD COLUMN archived_at TIMESTAMPTZ;

