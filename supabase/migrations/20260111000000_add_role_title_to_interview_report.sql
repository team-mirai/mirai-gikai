-- Add role_title column to interview_report table
-- role_title is a short summary (10 characters or less) derived from role_description
ALTER TABLE interview_report
ADD COLUMN role_title TEXT;

-- Add comment explaining the column purpose
COMMENT ON COLUMN interview_report.role_title IS 'A short title (10 characters or less) summarizing the user role, e.g., "物流業者", "主婦"';
