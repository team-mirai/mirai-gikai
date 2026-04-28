-- bills テーブルに knowledge_source と use_knowledge_source_in_chat を追加し、
-- 既存の interview_configs.knowledge_source を bills 側に移設する。
--
-- 背景: AIチャットでもナレッジソースを参照できるようにしたいが、
-- ナレッジは「議案に紐づく事実情報」なので bills に持たせるのが自然。
-- インタビュー設定の作成を前提にせずチャットでも使えるようにする。

ALTER TABLE bills
  ADD COLUMN knowledge_source TEXT,
  ADD COLUMN use_knowledge_source_in_chat BOOLEAN NOT NULL DEFAULT false;

-- 既存の interview_configs.knowledge_source を bills 側へコピーする。
-- 同一 bill に複数 config がある場合は、公開中 (status='public') を最優先し、
-- 同条件内では updated_at が最新のものを採用する。
UPDATE bills b
SET knowledge_source = sub.knowledge_source
FROM (
  SELECT DISTINCT ON (bill_id)
    bill_id,
    knowledge_source
  FROM interview_configs
  WHERE knowledge_source IS NOT NULL
    AND btrim(knowledge_source) <> ''
  ORDER BY bill_id, (status = 'public') DESC, updated_at DESC, id DESC
) sub
WHERE b.id = sub.bill_id;

ALTER TABLE interview_configs DROP COLUMN knowledge_source;
