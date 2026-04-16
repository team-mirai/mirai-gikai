-- Zero-downtime rename: published_at → submitted_date
-- Phase 1: Add submitted_date column with sync trigger (this migration)
-- Phase 2: Drop published_at column and trigger (future migration)

-- 1. Add new column
ALTER TABLE bills ADD COLUMN submitted_date TIMESTAMP WITH TIME ZONE;

-- 2. Copy existing data
UPDATE bills SET submitted_date = published_at;

-- 3. Create bidirectional sync trigger for transition period
CREATE OR REPLACE FUNCTION sync_bills_published_submitted() RETURNS trigger AS $$
BEGIN
  -- When old code writes published_at, sync to submitted_date
  IF (TG_OP = 'UPDATE' AND NEW.published_at IS DISTINCT FROM OLD.published_at AND NEW.submitted_date IS NOT DISTINCT FROM OLD.submitted_date) THEN
    NEW.submitted_date := NEW.published_at;
  -- When new code writes submitted_date, sync to published_at
  ELSIF (TG_OP = 'UPDATE' AND NEW.submitted_date IS DISTINCT FROM OLD.submitted_date AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at) THEN
    NEW.published_at := NEW.submitted_date;
  -- When both change simultaneously, submitted_date wins (new code is authoritative)
  ELSIF (TG_OP = 'UPDATE' AND NEW.published_at IS DISTINCT FROM OLD.published_at AND NEW.submitted_date IS DISTINCT FROM OLD.submitted_date) THEN
    NEW.published_at := NEW.submitted_date;
  -- On INSERT, sync whichever is provided
  ELSIF (TG_OP = 'INSERT') THEN
    IF NEW.submitted_date IS NOT NULL AND NEW.published_at IS NOT NULL AND NEW.published_at IS DISTINCT FROM NEW.submitted_date THEN
      -- Both provided but inconsistent: new column wins during transition
      NEW.published_at := NEW.submitted_date;
    ELSIF NEW.submitted_date IS NULL AND NEW.published_at IS NOT NULL THEN
      NEW.submitted_date := NEW.published_at;
    ELSIF NEW.published_at IS NULL AND NEW.submitted_date IS NOT NULL THEN
      NEW.published_at := NEW.submitted_date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_bills_published_submitted
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION sync_bills_published_submitted();

-- 4. Add index on new column
CREATE INDEX idx_bills_submitted_date ON bills(submitted_date DESC);

-- 5. Add comment
COMMENT ON COLUMN bills.submitted_date IS '法案提出日';
