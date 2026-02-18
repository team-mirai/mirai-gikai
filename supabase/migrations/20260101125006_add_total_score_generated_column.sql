-- interview_report テーブルに total_score Generated Column を追加
-- scores JSONB から total を抽出し、INTEGER として保存
-- scores が null または total が存在しない場合は null になる

ALTER TABLE interview_report
ADD COLUMN total_score INTEGER GENERATED ALWAYS AS (
  CASE
    WHEN scores IS NOT NULL
      AND scores->>'total' IS NOT NULL
      AND scores->>'total' ~ '^\d+$'
    THEN (scores->>'total')::integer
    ELSE NULL
  END
) STORED;

-- ソート用のインデックスを追加（降順、NULLは最後）
CREATE INDEX idx_interview_report_total_score ON interview_report(total_score DESC NULLS LAST);

-- コメント追加
COMMENT ON COLUMN interview_report.total_score IS '総合スコア（0-100）- scoresから自動生成されるGenerated Column';
