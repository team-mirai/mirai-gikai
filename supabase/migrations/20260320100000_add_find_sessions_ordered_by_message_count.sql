-- Fetch interview sessions ordered by message count with pagination
-- Used for admin report list table sorting by message count
CREATE OR REPLACE FUNCTION find_sessions_ordered_by_message_count(
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
  LEFT JOIN (
    SELECT im.interview_session_id, COUNT(*)::BIGINT AS cnt
    FROM interview_messages im
    INNER JOIN interview_sessions iss
      ON iss.id = im.interview_session_id
    WHERE iss.interview_config_id = p_config_id
    GROUP BY im.interview_session_id
  ) mc ON mc.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(mc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(mc.cnt, 0) END DESC,
    s.started_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
