-- 増分トピック分析: 指定意見群のトピック抽出済みウォーターマークを
-- 単一 UPDATE で原子的に記録する。アプリ層で id をチャンク分割して複数回更新すると、
-- 途中失敗時に一部だけ topic_extracted_at が進んだ半端な状態が残るため、
-- 配列引数を受ける関数に寄せて all-or-nothing にする（PostgREST の URL 長制限も回避）。
CREATE OR REPLACE FUNCTION mark_opinions_extracted(
  p_ids UUID[],
  p_extracted_at TIMESTAMPTZ
) RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE interview_opinion
  SET topic_extracted_at = p_extracted_at
  WHERE id = ANY(p_ids);
$$;

COMMENT ON FUNCTION mark_opinions_extracted(UUID[], TIMESTAMPTZ) IS
  '指定意見群の topic_extracted_at を単一トランザクションで一括更新する（増分トピック分析の抽出済み記録）';
