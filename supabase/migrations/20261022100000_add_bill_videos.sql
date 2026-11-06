-- 議案に紐づくYouTube動画（党内の議論の配信など）
create table bill_videos (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 200),
  display_order integer not null check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (bill_id, display_order)
);

alter table bill_videos enable row level security;

comment on table bill_videos is '議案に紐づくYouTube動画';
comment on column bill_videos.youtube_video_id is 'YouTubeの動画ID（11文字）';
comment on column bill_videos.title is '議案ページに表示する動画タイトル（1〜200文字）';
comment on column bill_videos.display_order is '議案ページでの表示順（0始まり）';

-- 議案の動画一覧を丸ごと置き換える（削除と追加を1トランザクションで行う）
-- p_videos: [{ "youtube_video_id": "...", "title": "..." }, ...] の配列順が表示順になる
create function replace_bill_videos(
  p_bill_id uuid,
  p_videos jsonb
) returns void as $$
begin
  delete from bill_videos where bill_id = p_bill_id;

  insert into bill_videos (bill_id, youtube_video_id, title, display_order)
  select
    p_bill_id,
    v.value ->> 'youtube_video_id',
    v.value ->> 'title',
    (v.ordinality - 1)::integer
  from jsonb_array_elements(p_videos) with ordinality as v(value, ordinality);
end;
$$ language plpgsql volatile;
