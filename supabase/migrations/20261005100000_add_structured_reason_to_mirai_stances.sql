-- チームみらいの賛否の新フォーマット（判断の理由の一言 + 箇条書き + 補足情報）
-- 既存の comment（旧フォーマット）は残し、新フォーマットのデータがある場合は公開側で新フォーマットを優先表示する
ALTER TABLE mirai_stances
  ADD COLUMN reason_summary TEXT,
  ADD COLUMN reason_points TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN supplements JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN mirai_stances.reason_summary IS '判断の理由（一言）。新フォーマット';
COMMENT ON COLUMN mirai_stances.reason_points IS '判断の理由を補強する箇条書き。新フォーマット';
COMMENT ON COLUMN mirai_stances.supplements IS '補足情報（[{ title, body }] の配列。body は Markdown）。新フォーマット';
