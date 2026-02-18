-- Count messages per interview_session_id in a single query via RPC
CREATE OR REPLACE FUNCTION get_interview_message_counts(session_ids UUID[])
RETURNS TABLE (
  interview_session_id UUID,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    im.interview_session_id,
    COUNT(*)::BIGINT AS message_count
  FROM interview_messages im
  WHERE im.interview_session_id = ANY(session_ids)
  GROUP BY im.interview_session_id;
END;
$$ LANGUAGE plpgsql STABLE;

