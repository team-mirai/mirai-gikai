-- Rename "scores" concept to "content_richness" (情報の充実度)
-- The JSONB internal keys (total, clarity, specificity, impact, constructiveness, reasoning) remain unchanged.
-- Only column names, generated columns, RPC function names, and return column names are renamed.

-- 1. Drop the generated column (depends on "scores" column)
ALTER TABLE interview_report DROP COLUMN total_score;

-- 2. Rename JSONB column
ALTER TABLE interview_report RENAME COLUMN scores TO content_richness;

-- 3. Recreate generated column with new name
ALTER TABLE interview_report
ADD COLUMN total_content_richness INTEGER GENERATED ALWAYS AS (
  CASE
    WHEN content_richness IS NOT NULL
      AND content_richness->>'total' IS NOT NULL
      AND content_richness->>'total' ~ '^\d+$'
    THEN (content_richness->>'total')::integer
    ELSE NULL
  END
) STORED;

CREATE INDEX idx_interview_report_total_content_richness
  ON interview_report(total_content_richness DESC NULLS LAST);

COMMENT ON COLUMN interview_report.content_richness IS 'インタビューの情報充実度評価（total, clarity, specificity, impact, constructiveness, reasoning）';
COMMENT ON COLUMN interview_report.total_content_richness IS '総合的な情報充実度（0-100）- content_richnessから自動生成されるGenerated Column';

-- 4. Rename find_sessions_ordered_by_total_score → find_sessions_ordered_by_total_content_richness
DROP FUNCTION IF EXISTS find_sessions_ordered_by_total_score(UUID, BOOLEAN, INT, INT, TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION find_sessions_ordered_by_total_content_richness(
  p_config_id UUID,
  p_ascending BOOLEAN DEFAULT FALSE,
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 30,
  p_status TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT NULL,
  p_stance TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS TABLE (session_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r
    ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN r.total_content_richness END ASC NULLS LAST,
    CASE WHEN NOT p_ascending THEN r.total_content_richness END DESC NULLS LAST,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Rename avg_total_score → avg_total_content_richness in get_interview_statistics
DROP FUNCTION IF EXISTS get_interview_statistics(UUID);

CREATE FUNCTION get_interview_statistics(p_config_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  avg_rating NUMERIC,
  stance_for_count BIGINT,
  stance_against_count BIGINT,
  stance_neutral_count BIGINT,
  avg_total_content_richness NUMERIC,
  role_subject_expert_count BIGINT,
  role_work_related_count BIGINT,
  role_daily_life_affected_count BIGINT,
  role_general_citizen_count BIGINT,
  avg_message_count NUMERIC,
  median_duration_seconds NUMERIC,
  public_by_user_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(s.id) AS total_sessions,
    COUNT(s.completed_at) AS completed_sessions,
    ROUND(AVG(s.rating)::NUMERIC, 2) AS avg_rating,
    COUNT(CASE WHEN r.stance = 'for' THEN 1 END) AS stance_for_count,
    COUNT(CASE WHEN r.stance = 'against' THEN 1 END) AS stance_against_count,
    COUNT(CASE WHEN r.stance = 'neutral' THEN 1 END) AS stance_neutral_count,
    ROUND(AVG(r.total_content_richness)::NUMERIC, 1) AS avg_total_content_richness,
    COUNT(CASE WHEN r.role = 'subject_expert' THEN 1 END) AS role_subject_expert_count,
    COUNT(CASE WHEN r.role = 'work_related' THEN 1 END) AS role_work_related_count,
    COUNT(CASE WHEN r.role = 'daily_life_affected' THEN 1 END) AS role_daily_life_affected_count,
    COUNT(CASE WHEN r.role = 'general_citizen' THEN 1 END) AS role_general_citizen_count,
    ROUND(AVG(COALESCE(mc.message_count, 0))::NUMERIC, 1) AS avg_message_count,
    ROUND(
      (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (sub.completed_at - sub.started_at))
      )
      FROM interview_sessions sub
      WHERE sub.interview_config_id = p_config_id
        AND sub.completed_at IS NOT NULL
      )::NUMERIC, 0
    ) AS median_duration_seconds,
    COUNT(CASE WHEN r.is_public_by_user = TRUE THEN 1 END) AS public_by_user_count
  FROM interview_sessions s
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  LEFT JOIN (
    SELECT im.interview_session_id, COUNT(*) AS message_count
    FROM interview_messages im
    GROUP BY im.interview_session_id
  ) mc ON mc.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id;
END;
$$ LANGUAGE plpgsql STABLE;
