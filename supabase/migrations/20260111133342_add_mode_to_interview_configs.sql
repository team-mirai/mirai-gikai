-- Add interview mode to interview_configs
-- Modes: loop (逐次深掘り) and bulk (一括深掘り)

-- Step 1: Create enum type for interview mode
CREATE TYPE interview_mode_enum AS ENUM ('loop', 'bulk');

-- Step 2: Add mode column with default value 'loop'
ALTER TABLE interview_configs
ADD COLUMN mode interview_mode_enum NOT NULL DEFAULT 'loop';

-- Step 3: Add comment for documentation
COMMENT ON COLUMN interview_configs.mode IS 'インタビューモード: loop（逐次深掘り）または bulk（一括深掘り）';
