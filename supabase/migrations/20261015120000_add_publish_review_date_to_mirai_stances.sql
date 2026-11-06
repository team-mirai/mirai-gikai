-- 非公開で事前登録した賛否・判断の理由について、公開確認を出す日（JST の日付）
ALTER TABLE mirai_stances
  ADD COLUMN publish_review_date DATE;

COMMENT ON COLUMN mirai_stances.publish_review_date IS '公開確認日（JST）。非公開（is_published=false）の賛否について、この日以降に Slack で政調会長へ公開確認を出す';

-- 公開確認日の変更は内容の変更ではないため updated_at を更新しない。
-- updated_at は「公開確認後に内容が編集されていないか」の判定に使う（publish_mirai_stance）
DROP TRIGGER update_mirai_stances_updated_at ON mirai_stances;
CREATE TRIGGER update_mirai_stances_updated_at BEFORE UPDATE ON mirai_stances
  FOR EACH ROW
  WHEN ((to_jsonb(OLD) - 'publish_review_date') IS DISTINCT FROM (to_jsonb(NEW) - 'publish_review_date'))
  EXECUTE FUNCTION update_updated_at_column();
