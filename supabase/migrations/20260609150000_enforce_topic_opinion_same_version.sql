-- topic_opinion.topic_id と version_id が独立した外部キーのままだと、
-- 別バージョンの topic を参照する行を作れてしまう（CodeRabbit #828 指摘）。
-- topic(version_id, id) への複合外部キーに置き換え、同一バージョン内の topic しか
-- 参照できないように強制する。topic_opinion は本番未使用のため既存データ移行は不要。

-- 複合FKの参照先となる一意制約（id は PK だが複合参照には明示的な UNIQUE が必要）
ALTER TABLE topic
  ADD CONSTRAINT topic_version_id_id_key UNIQUE (version_id, id);

-- 独立していた topic_id 単独FKを外し、(version_id, topic_id) の複合FKに置き換える
ALTER TABLE topic_opinion
  DROP CONSTRAINT topic_opinion_topic_id_fkey;

ALTER TABLE topic_opinion
  ADD CONSTRAINT topic_opinion_topic_fk
  FOREIGN KEY (version_id, topic_id)
  REFERENCES topic (version_id, id)
  ON DELETE CASCADE;
