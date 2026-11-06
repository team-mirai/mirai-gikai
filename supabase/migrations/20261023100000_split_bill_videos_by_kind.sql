-- 「関連動画」の一覧をやめ、議論の種類ごとに1本ずつ動画を紐づける形に作り直す
drop function if exists replace_bill_videos(uuid, jsonb);
drop table if exists bill_videos;

create type bill_video_kind as enum (
  'stance_decision', -- 賛否を決めた時の議論
  'caucus'           -- 議員団での議論
);

create table bill_videos (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  kind bill_video_kind not null,
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (bill_id, kind)
);

alter table bill_videos enable row level security;

comment on table bill_videos is '議案に紐づくYouTube動画（議論の種類ごとに1本）';
comment on column bill_videos.kind is '議論の種類（stance_decision: 賛否を決めた時の議論 / caucus: 議員団での議論）';
comment on column bill_videos.youtube_video_id is 'YouTubeの動画ID（11文字）';
comment on column bill_videos.title is '議案ページに表示する動画タイトル（1〜200文字）';
