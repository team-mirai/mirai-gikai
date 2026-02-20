-- インタビュー設定にチャット用AIモデル選択カラムを追加
-- Vercel AI Gateway形式のモデルID（例: "openai/gpt-4o-mini"）を格納
-- NULLの場合はデフォルトモデル（gpt-4o-mini）を使用

ALTER TABLE interview_configs
ADD COLUMN chat_model TEXT DEFAULT NULL;
