-- Add is_data_reuse_consented column to interview_report table
-- インタビューデータの二次利用（オープンデータとしての第三者提供）に対する
-- ユーザーの利用許諾を記録する。
-- 新しい利用規約（データの第三者提供を含む）を確認した上で同意した場合のみ true。
-- 過去のレポートおよび新規約の確認前に提出されたレポートは false のまま。

ALTER TABLE interview_report
ADD COLUMN is_data_reuse_consented BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN interview_report.is_data_reuse_consented IS 'ユーザーがデータの二次利用（オープンデータとしての第三者提供）に同意したか（新利用規約を確認した上での同意のみ true）';
