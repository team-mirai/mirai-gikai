-- interview_configsテーブルにdeleted_atカラムを追加
-- 管理画面からインタビュー設定を削除した場合に設定される（論理削除）
-- 物理削除（CASCADE）の代わりに、deleted_atを設定して一覧・公開取得から除外する
ALTER TABLE interview_configs ADD COLUMN deleted_at TIMESTAMPTZ;
