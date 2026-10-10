-- AI自動生成版記事の誤り報告の種類
create type article_report_category as enum (
  'factual_error',
  'outdated',
  'unclear',
  'other'
);

-- 読者からの記事の誤り報告
create table bill_article_reports (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  difficulty_level difficulty_level_enum not null,
  category article_report_category,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table bill_article_reports enable row level security;

-- 議案ごとの新しい順一覧用インデックス
create index idx_bill_article_reports_bill_created_at
  on bill_article_reports(bill_id, created_at desc);

comment on table bill_article_reports is 'AI自動生成版記事に対する読者からの誤り報告';
comment on column bill_article_reports.difficulty_level is '報告時に読者が表示していた記事の難易度';
comment on column bill_article_reports.category is '誤りの種類。未選択の場合は null';
comment on column bill_article_reports.body is '報告本文（1〜1000文字）';
