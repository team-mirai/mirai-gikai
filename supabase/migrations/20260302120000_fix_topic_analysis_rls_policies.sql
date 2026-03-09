-- 不要な全アクセスポリシーを削除
-- service_role は RLS をバイパスするため、明示的なポリシーは不要
-- 他テーブル（bills, interview_configs 等）と同じパターンに統一

DROP POLICY IF EXISTS "Service role full access" ON topic_analysis_versions;
DROP POLICY IF EXISTS "Service role full access" ON topic_analysis_topics;
DROP POLICY IF EXISTS "Service role full access" ON topic_analysis_classifications;
