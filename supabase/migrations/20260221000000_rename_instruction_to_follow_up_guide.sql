-- interview_questions テーブルの instruction カラムを follow_up_guide にリネーム
ALTER TABLE interview_questions RENAME COLUMN instruction TO follow_up_guide;

-- カラムコメントを更新
COMMENT ON COLUMN interview_questions.follow_up_guide IS '回答後のフォローアップ指針（深掘り方法など）';
