-- チームみらいの賛否（type / comment）を指定日時に公開するための予約公開日時
ALTER TABLE mirai_stances
  ADD COLUMN publish_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN mirai_stances.publish_at IS '賛否・コメントの公開日時（NULL: 即時公開）。この日時より前は公開側で未設定として扱う';
