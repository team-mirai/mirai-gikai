-- 政務調査向け分析のための意見タグ。
-- 「専門家の意見だけを見る」絞り込みは interview_report.role では成立しない
-- （role=subject_expert は自己申告ベースで全意見の1%未満しか付かない）。
-- 発言の根拠（reasoning_types）を意見単位で持つことで、肩書ではなく
-- 「職業・専門分野の知見に基づく発言」で絞り込めるようにする。
-- concern / proposal は懸念一覧・具体提案一覧の表示に使う。

ALTER TABLE interview_opinion
  ADD COLUMN concern TEXT,
  ADD COLUMN proposal TEXT,
  ADD COLUMN reasoning_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN tags_extracted_at TIMESTAMPTZ;

COMMENT ON COLUMN interview_opinion.concern IS
  '意見が示す懸念の要点（20-50字）。懸念でなければ NULL';
COMMENT ON COLUMN interview_opinion.proposal IS
  '意見が示す具体的な提案・要望の要点（20-50字）。提案でなければ NULL';
COMMENT ON COLUMN interview_opinion.reasoning_types IS
  '発言の根拠の種類（personal_experience / family_observation / professional_expertise / research_reference / overseas_example / intuition / none）。専門家フィルタは professional_expertise の包含で判定する。「未抽出」は tags_extracted_at IS NULL が表すため、本列は NOT NULL DEFAULT {} とし空配列と NULL を区別しない';
COMMENT ON COLUMN interview_opinion.tags_extracted_at IS
  'タグ（concern/proposal/reasoning_types）を抽出した時刻。NULL=未抽出（タグバックフィルの対象）';

-- タグ未抽出の意見を引くための部分インデックス（バックフィルの対象抽出）
CREATE INDEX idx_interview_opinion_tags_pending
  ON interview_opinion (interview_report_id)
  WHERE tags_extracted_at IS NULL;

-- reasoning_types の包含検索（専門家フィルタ）用
CREATE INDEX idx_interview_opinion_reasoning_types
  ON interview_opinion USING GIN (reasoning_types);
