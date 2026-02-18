-- Allow multiple interview configs per bill with required name field
-- Only one config per bill can have status='public'

-- Step 1: Add name column with default value for existing records
ALTER TABLE interview_configs
ADD COLUMN name TEXT NOT NULL DEFAULT 'デフォルト設定';

-- Step 2: Remove the default constraint after migration
ALTER TABLE interview_configs
ALTER COLUMN name DROP DEFAULT;

-- Step 3: Drop the UNIQUE constraint on bill_id
-- First, find and drop the unique constraint
ALTER TABLE interview_configs DROP CONSTRAINT IF EXISTS interview_configs_bill_id_key;

-- Step 4: Create partial unique index to ensure only one public config per bill
CREATE UNIQUE INDEX idx_interview_configs_bill_public
ON interview_configs(bill_id)
WHERE status = 'public';

-- Step 5: Create index for querying configs by bill_id
CREATE INDEX idx_interview_configs_bill_id ON interview_configs(bill_id);

-- Update comments
COMMENT ON COLUMN interview_configs.name IS '設定名（識別用）';
COMMENT ON COLUMN interview_configs.bill_id IS '対象議案ID（複数設定可、ただしpublicは1つのみ）';
