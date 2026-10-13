-- 記事の種別（通常版 / AI自動生成版）
CREATE TYPE bill_article_kind AS ENUM ('standard', 'ai_generated');

ALTER TABLE bills
  ADD COLUMN article_kind bill_article_kind NOT NULL DEFAULT 'standard';

COMMENT ON COLUMN bills.article_kind IS '記事の種別。ai_generated の場合、人のレビューを経ていないAI自動生成版として表示する';

-- AI自動生成版はレビュー未完了であることを保証する
ALTER TABLE bills
  ADD CONSTRAINT chk_ai_generated_not_review_completed
  CHECK (NOT (article_kind = 'ai_generated' AND is_review_completed));
