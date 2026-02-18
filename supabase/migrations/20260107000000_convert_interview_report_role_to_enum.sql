-- Create ENUM type for interview_report.role
CREATE TYPE interview_report_role_enum AS ENUM (
  'subject_expert',        -- 専門家
  'work_related',          -- 仕事関係者
  'daily_life_affected',   -- 生活影響を受ける人
  'general_citizen'        -- 一般市民
);

-- Alter the interview_report table to use the new ENUM type
-- First, we need to update existing data to match one of the ENUM values
-- Since existing data uses Japanese text like "当事者A", we'll map them to general_citizen as a safe default
UPDATE interview_report
SET role = 'general_citizen'
WHERE role IS NOT NULL;

-- Now alter the column to use the ENUM type
ALTER TABLE interview_report
ALTER COLUMN role TYPE interview_report_role_enum
USING CASE
  WHEN role IS NULL THEN NULL
  ELSE role::interview_report_role_enum
END;

-- Add comment for documentation
COMMENT ON TYPE interview_report_role_enum IS 'インタビュー対象者の役割・属性を表すENUM型';
COMMENT ON COLUMN interview_report.role IS 'AIが推論したユーザーの役割・属性（ENUM型）';
