-- billsテーブルにpublish_statusのソート順を表すgenerated columnを追加
-- 下書き(draft)→Coming Soon(coming_soon)→公開(published) の順
ALTER TABLE bills ADD COLUMN publish_status_order INT GENERATED ALWAYS AS (
  CASE publish_status
    WHEN 'draft'       THEN 0
    WHEN 'coming_soon' THEN 1
    WHEN 'published'   THEN 2
  END
) STORED;

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_bills_publish_status_order ON bills(publish_status_order);
