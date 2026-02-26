-- インタビュー中のユーザー評価（星1〜5）を保存するテーブル
create table if not exists interview_session_ratings (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references interview_sessions(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now()
);

-- セッションごとの評価を素早く検索するためのインデックス
create index idx_interview_session_ratings_session_id
  on interview_session_ratings(interview_session_id);

-- RLSを有効化（サービスロールのみ書き込み可能）
alter table interview_session_ratings enable row level security;
