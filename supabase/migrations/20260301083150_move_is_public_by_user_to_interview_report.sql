-- Move is_public_by_user from interview_sessions to interview_report
-- This column belongs on the report as it represents user consent for report publication

-- Step 1: Add is_public_by_user to interview_report
ALTER TABLE interview_report
ADD COLUMN is_public_by_user BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN interview_report.is_public_by_user IS 'Whether the user has consented to making their interview report public';

-- Step 2: Migrate existing data from interview_sessions to interview_report
UPDATE interview_report
SET is_public_by_user = interview_sessions.is_public_by_user
FROM interview_sessions
WHERE interview_report.interview_session_id = interview_sessions.id;

-- Step 3: Drop the column from interview_sessions
ALTER TABLE interview_sessions
DROP COLUMN is_public_by_user;
