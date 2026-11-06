-- トピックの2階層化。
--
-- 1議案で数十件のトピックが並列に並ぶと、論点の網羅チェックに使うリストとして読めない。
-- 大トピックで畳んでから中トピックを見る形にする。
--
-- 大トピック = 子を持つトピック。中トピック（葉）= 子を持たないトピック。
-- 「親が NULL かどうか」ではなく「子を持つかどうか」で判定すること。
-- 本マイグレーション以前の version は全トピックが親も子も持たないため、
-- この規則なら旧データはすべて葉として扱われる（後方互換）。
--
-- 意見が紐づくのは葉だけ。大トピックの件数は配下の合計として読み出し側が算出する
-- （同じ意見を親子で二重に持つと集計がずれるため）。

ALTER TABLE topic
  ADD COLUMN parent_topic_id UUID;

-- 別 version のトピックを親にできないよう複合FKで縛る。
-- topic_opinion が同じ理由で (version_id, id) への複合FKを使っている
-- （20260609150000_enforce_topic_opinion_same_version.sql）のに合わせる。
ALTER TABLE topic
  ADD CONSTRAINT topic_parent_same_version_fkey
  FOREIGN KEY (version_id, parent_topic_id)
  REFERENCES topic (version_id, id)
  ON DELETE CASCADE;

COMMENT ON COLUMN topic.parent_topic_id IS
  '親トピック（大トピック）。同一 version 内のみ参照可。NULL=大トピックまたは旧データの葉。「大トピックか」は子の有無で判定する';

CREATE INDEX idx_topic_parent ON topic (parent_topic_id);

-- グルーピング工程（group）を current_step に追加した。
COMMENT ON COLUMN topic_analysis_version.current_step IS
  '実行中のステップ: extract | merge | assign | group | done';
