-- インタビュー中のユーザー評価（星1〜5）を保存するテーブル
-- 1セッションにつき1評価のみ（UNIQUE制約）
create table if not exists interview_session_ratings (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references interview_sessions(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  unique (interview_session_id)
);

-- RLSを有効化（サービスロールのみ書き込み可能）
alter table interview_session_ratings enable row level security;
