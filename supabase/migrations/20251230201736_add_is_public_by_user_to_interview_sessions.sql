-- Add is_public_by_user column to interview_sessions table
ALTER TABLE interview_sessions
ADD COLUMN is_public_by_user BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN interview_sessions.is_public_by_user IS 'Whether the user has consented to making their interview public';
