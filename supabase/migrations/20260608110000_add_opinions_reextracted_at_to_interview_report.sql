-- 意見再抽出バックフィル（Step 2）の進捗追跡用カラム。
-- NULL = 未再抽出。チャンク処理が完了するごとに now() を記録し、
-- 再開可能・冪等（NULL に戻せば再処理対象に戻る）にする。
ALTER TABLE interview_report
  ADD COLUMN opinions_reextracted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN interview_report.opinions_reextracted_at IS '意見再抽出バックフィルの完了時刻（NULL=未処理）';
