-- expert_registrations を interview_session_id ベースから user_id ベースに変更

-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_expert_registrations_session_id;

-- user_id カラムを nullable で追加
ALTER TABLE expert_registrations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 既存データがある場合、interview_sessions から user_id をバックフィル
UPDATE expert_registrations er
SET user_id = s.user_id
FROM interview_sessions s
WHERE er.interview_session_id = s.id;

-- バックフィル後に NOT NULL 制約を付与
ALTER TABLE expert_registrations ALTER COLUMN user_id SET NOT NULL;

-- interview_session_id カラムを削除
ALTER TABLE expert_registrations DROP COLUMN interview_session_id;

-- ユーザーごとに1件のみ登録可能
CREATE UNIQUE INDEX idx_expert_registrations_user_id ON expert_registrations(user_id);

-- カラムコメント更新
COMMENT ON COLUMN expert_registrations.user_id IS '登録したユーザーのID';
