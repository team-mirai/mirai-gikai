-- 増分トピック分析用の抽出ウォーターマーク。
-- トピック抽出(Phase1)の対象に含めた意見に時刻を記録する。
-- NULL = まだ一度もトピック抽出にかけられていない「新規意見」（増分抽出の対象）。
ALTER TABLE interview_opinion
  ADD COLUMN topic_extracted_at TIMESTAMPTZ;

COMMENT ON COLUMN interview_opinion.topic_extracted_at IS
  'トピック抽出(Phase1)の対象に含めた時刻。NULL=未抽出(増分トピック分析の新規対象)';
