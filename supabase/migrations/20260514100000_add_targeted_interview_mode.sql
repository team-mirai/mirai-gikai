-- Add 'targeted' value to interview_mode_enum and target_audience column to interview_questions.
--
-- targeted モード: loop モードと同様の都度深掘りに加え、各質問に「対象者条件」を任意で付与できる。
-- 対象者条件にマッチしないインタビュイーには当該質問をスキップする。

ALTER TYPE interview_mode_enum ADD VALUE IF NOT EXISTS 'targeted';

ALTER TABLE interview_questions
ADD COLUMN target_audience TEXT;

COMMENT ON COLUMN interview_questions.target_audience IS
  '対象者条件（任意）。指定された場合、LLMが会話文脈からインタビュイーの該当性を判定し、非該当なら質問をスキップする。targetedモードでのみ利用される。';
