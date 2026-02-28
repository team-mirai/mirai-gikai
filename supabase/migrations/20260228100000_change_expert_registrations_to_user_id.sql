-- expert_registrations を interview_session_id ベースから user_id ベースに変更

-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_expert_registrations_session_id;

-- interview_session_id カラムを削除し、user_id カラムを追加
ALTER TABLE expert_registrations DROP COLUMN interview_session_id;
ALTER TABLE expert_registrations ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- ユーザーごとに1件のみ登録可能
CREATE UNIQUE INDEX idx_expert_registrations_user_id ON expert_registrations(user_id);

-- カラムコメント更新
COMMENT ON COLUMN expert_registrations.user_id IS '登録したユーザーのID';
