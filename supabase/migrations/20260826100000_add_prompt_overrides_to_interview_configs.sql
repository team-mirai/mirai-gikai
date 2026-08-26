-- インタビュー設定ごとのプロンプト上書きを保持する。
--
-- 既定のプロンプトはコード側（packages/shared/src/interview-prompts）に置いたままで、
-- ここには管理画面で編集された節だけを入れる。null または空オブジェクトなら全て既定値。
-- 節を増減させるたびにマイグレーションを打たずに済むよう jsonb で持つ。
-- 受け付けるキーはアプリ側の zod スキーマで検証する。
alter table interview_configs
  add column prompt_overrides jsonb;

comment on column interview_configs.prompt_overrides is
  'インタビュープロンプトの節ごとの上書き。キーは PROMPT_SECTION_KEYS（responsibilities / cautions / expertiseDetection / deepDiveTechniques / stopCriteria / questionUsageRules）。未設定の節はコード側の既定値を使う。';
