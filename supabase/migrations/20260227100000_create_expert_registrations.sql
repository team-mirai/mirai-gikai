-- 有識者リスト登録情報を管理するテーブル
CREATE TABLE expert_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  affiliation TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- セッションごとに1件のみ登録可能
CREATE UNIQUE INDEX idx_expert_registrations_session_id ON expert_registrations(interview_session_id);

-- メールアドレスの一意性を保証
CREATE UNIQUE INDEX idx_expert_registrations_email ON expert_registrations(email);

-- updated_atトリガー
CREATE TRIGGER update_expert_registrations_updated_at
  BEFORE UPDATE ON expert_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE expert_registrations ENABLE ROW LEVEL SECURITY;

-- カラムコメント
COMMENT ON TABLE expert_registrations IS '有識者リスト登録情報を管理するテーブル';
COMMENT ON COLUMN expert_registrations.interview_session_id IS '登録元のインタビューセッションID';
COMMENT ON COLUMN expert_registrations.name IS '有識者の氏名';
COMMENT ON COLUMN expert_registrations.affiliation IS '所属・肩書';
COMMENT ON COLUMN expert_registrations.email IS 'メールアドレス';
