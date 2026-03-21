-- Compute aggregate interview statistics for a given interview config
-- Used for admin interview report list page statistics display
CREATE OR REPLACE FUNCTION get_interview_statistics(p_config_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  avg_rating NUMERIC,
  stance_for_count BIGINT,
  stance_against_count BIGINT,
  stance_neutral_count BIGINT,
  avg_total_score NUMERIC,
  role_subject_expert_count BIGINT,
  role_work_related_count BIGINT,
  role_daily_life_affected_count BIGINT,
  role_general_citizen_count BIGINT,
  avg_message_count NUMERIC,
  avg_duration_seconds NUMERIC,
  public_by_user_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Session counts
    COUNT(s.id) AS total_sessions,
    COUNT(s.completed_at) AS completed_sessions,

    -- Average satisfaction rating (from completed sessions with rating)
    ROUND(AVG(s.rating)::NUMERIC, 2) AS avg_rating,

    -- Stance distribution (for/against/neutral only)
    COUNT(CASE WHEN r.stance = 'for' THEN 1 END) AS stance_for_count,
    COUNT(CASE WHEN r.stance = 'against' THEN 1 END) AS stance_against_count,
    COUNT(CASE WHEN r.stance = 'neutral' THEN 1 END) AS stance_neutral_count,

    -- Average total score
    ROUND(AVG(r.total_score)::NUMERIC, 1) AS avg_total_score,

    -- Role distribution
    COUNT(CASE WHEN r.role = 'subject_expert' THEN 1 END) AS role_subject_expert_count,
    COUNT(CASE WHEN r.role = 'work_related' THEN 1 END) AS role_work_related_count,
    COUNT(CASE WHEN r.role = 'daily_life_affected' THEN 1 END) AS role_daily_life_affected_count,
    COUNT(CASE WHEN r.role = 'general_citizen' THEN 1 END) AS role_general_citizen_count,

    -- Average message count per session
    ROUND(AVG(COALESCE(mc.message_count, 0))::NUMERIC, 1) AS avg_message_count,

    -- Average duration in seconds (completed sessions only)
    ROUND(AVG(
      CASE WHEN s.completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at))
      END
    )::NUMERIC, 0) AS avg_duration_seconds,

    -- Public by user count
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
