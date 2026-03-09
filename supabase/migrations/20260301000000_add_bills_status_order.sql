-- billsテーブルにstatusのソート順を表すgenerated columnを追加
-- enacted(成立)を先頭に、審議進行度順で並べるための整数カラム
ALTER TABLE bills ADD COLUMN status_order INT GENERATED ALWAYS AS (
  CASE status
    WHEN 'enacted'              THEN 0
    WHEN 'rejected'             THEN 1
    WHEN 'in_receiving_house'   THEN 2
    WHEN 'in_originating_house' THEN 3
    WHEN 'introduced'           THEN 4
    WHEN 'preparing'            THEN 5
  END
) STORED;

CREATE INDEX idx_bills_status_order ON bills(status_order);
