-- Fetch interview sessions ordered by total_score with pagination
-- Used for admin report list table sorting by score
CREATE OR REPLACE FUNCTION find_sessions_ordered_by_total_score(
  p_config_id UUID,
  p_ascending BOOLEAN DEFAULT FALSE,
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 30
)
RETURNS TABLE (session_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r
    ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
  ORDER BY
    CASE WHEN p_ascending THEN r.total_score END ASC NULLS LAST,
    CASE WHEN NOT p_ascending THEN r.total_score END DESC NULLS LAST,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
