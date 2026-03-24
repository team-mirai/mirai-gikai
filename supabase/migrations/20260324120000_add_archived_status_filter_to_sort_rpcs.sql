-- Add archived status filter support to sort RPC functions
-- archived = completed_at IS NULL AND archived_at IS NOT NULL

-- 1. find_sessions_ordered_by_message_count
DROP FUNCTION IF EXISTS find_sessions_ordered_by_message_count(UUID, BOOLEAN, INT, INT, TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION find_sessions_ordered_by_message_count(
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
  LEFT JOIN (
    SELECT im.interview_session_id, COUNT(*)::BIGINT AS cnt
    FROM interview_messages im
    INNER JOIN interview_sessions iss
      ON iss.id = im.interview_session_id
    WHERE iss.interview_config_id = p_config_id
    GROUP BY im.interview_session_id
  ) mc ON mc.interview_session_id = s.id
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(mc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(mc.cnt, 0) END DESC,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. find_sessions_ordered_by_total_content_richness
DROP FUNCTION IF EXISTS find_sessions_ordered_by_total_content_richness(UUID, BOOLEAN, INT, INT, TEXT, TEXT, TEXT, TEXT);

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
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
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

-- 3. find_sessions_ordered_by_helpful_count
DROP FUNCTION IF EXISTS find_sessions_ordered_by_helpful_count(UUID, BOOLEAN, INT, INT, TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION find_sessions_ordered_by_helpful_count(
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
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  LEFT JOIN (
    SELECT rr.interview_report_id, COUNT(*)::BIGINT AS cnt
    FROM report_reactions rr
    WHERE rr.reaction_type = 'helpful'
    GROUP BY rr.interview_report_id
  ) hc ON hc.interview_report_id = r.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(hc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(hc.cnt, 0) END DESC,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
