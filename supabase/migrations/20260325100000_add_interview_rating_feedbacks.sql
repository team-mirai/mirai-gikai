-- フィードバックタグ種別のENUM型を作成
create type interview_feedback_tag_enum as enum (
  'irrelevant_questions',
  'not_aligned',
  'misunderstood',
  'too_many_questions',
  'other'
);

-- 低評価時のフィードバックタグテーブルを作成
create table interview_rating_feedbacks (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null
    references interview_sessions(id) on delete cascade,
  tag interview_feedback_tag_enum not null,
  created_at timestamptz not null default now(),

  -- 同一セッションに同じタグの重複を防止
  unique (interview_session_id, tag)
);

alter table interview_rating_feedbacks enable row level security;

-- 集計クエリ用インデックス
create index idx_interview_rating_feedbacks_session
  on interview_rating_feedbacks(interview_session_id);

create index idx_interview_rating_feedbacks_tag
  on interview_rating_feedbacks(tag);

comment on table interview_rating_feedbacks is '低評価（3以下）時のフィードバックタグ';
comment on column interview_rating_feedbacks.tag is 'フィードバックタグ種別';
