-- interview_configs に use_knowledge_source_in_chat カラムを追加
-- AIチャットのプロンプトに knowledge_source を含めるかどうかを制御するフラグ
-- デフォルトは false（オフ）。AIインタビュー側は引き続き常に knowledge_source を参照する。
ALTER TABLE interview_configs
  ADD COLUMN use_knowledge_source_in_chat BOOLEAN NOT NULL DEFAULT false;
