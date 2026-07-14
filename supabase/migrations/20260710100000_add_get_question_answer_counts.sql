-- Compute per-question respondent counts for a given interview config
-- Used for admin interview report list page statistics display

-- Extract the interview_questions.id an assistant message asked.
-- An assistant message's content is a JSON string carrying the asked
-- question id as "question_id" (legacy: "questionId"). Returns NULL for
-- legacy plain-text messages, non-object JSON, or non-UUID ids.
-- Keep in sync with the TypeScript parser:
-- web/src/features/interview-session/shared/message-utils.ts (parseMessageContent)
-- Requires PostgreSQL 16+ (pg_input_is_valid). This project runs PG 17
-- (see supabase/config.toml major_version).
CREATE OR REPLACE FUNCTION extract_assistant_question_id(content TEXT)
RETURNS UUID AS $$
DECLARE
  parsed JSONB;
  question_id_text TEXT;
BEGIN
  IF content IS NULL OR NOT pg_input_is_valid(content, 'jsonb') THEN
    RETURN NULL;
  END IF;

  parsed := content::jsonb;
  IF jsonb_typeof(parsed) <> 'object' THEN
    RETURN NULL;
  END IF;

  question_id_text := COALESCE(
    parsed ->> 'question_id',
    parsed ->> 'questionId'
  );
  IF question_id_text IS NULL
    OR NOT pg_input_is_valid(question_id_text, 'uuid') THEN
    RETURN NULL;
  END IF;

  RETURN question_id_text::uuid;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- A question counts as "asked" in a session when an assistant message
-- referencing it exists, and as "answered" when a user message exists
-- after that assistant message.
CREATE OR REPLACE FUNCTION get_question_answer_counts(p_config_id UUID)
RETURNS TABLE (
  question_id UUID,
  question TEXT,
  question_order INTEGER,
  asked_session_count BIGINT,
  answered_session_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH asked AS (
    SELECT t.session_id, t.created_at, t.qid
    FROM (
      SELECT
        m.interview_session_id AS session_id,
        m.created_at,
        extract_assistant_question_id(m.content) AS qid
      FROM interview_messages m
      JOIN interview_sessions s ON s.id = m.interview_session_id
      WHERE s.interview_config_id = p_config_id
        AND m.role = 'assistant'
    ) t
    WHERE t.qid IS NOT NULL
  ),
  last_user_message AS (
    SELECT
      m.interview_session_id AS session_id,
      MAX(m.created_at) AS last_user_at
    FROM interview_messages m
    JOIN interview_sessions s ON s.id = m.interview_session_id
    WHERE s.interview_config_id = p_config_id
      AND m.role = 'user'
    GROUP BY m.interview_session_id
  )
  SELECT
    q.id AS question_id,
    q.question,
    q.question_order,
    COUNT(DISTINCT a.session_id) AS asked_session_count,
    COUNT(DISTINCT a.session_id) FILTER (WHERE lu.last_user_at > a.created_at)
      AS answered_session_count
  FROM interview_questions q
  LEFT JOIN asked a ON a.qid = q.id
  LEFT JOIN last_user_message lu ON lu.session_id = a.session_id
  WHERE q.interview_config_id = p_config_id
  GROUP BY q.id, q.question, q.question_order
  ORDER BY q.question_order;
END;
$$ LANGUAGE plpgsql STABLE;
