-- bills テーブルに記事レビュー完了フラグを追加
ALTER TABLE bills ADD COLUMN is_review_completed BOOLEAN NOT NULL DEFAULT false;

-- 既に公開済みの議案はレビュー完了済みとする
UPDATE bills SET is_review_completed = true WHERE publish_status = 'published';

COMMENT ON COLUMN bills.is_review_completed IS '記事のレビューが完了しているかどうか（falseの場合、記事にレビュー中バナーが表示される）';
