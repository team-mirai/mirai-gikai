-- レポートへのリアクション機能
-- ユーザーは1つのレポートに対して1つのリアクション（helpful or hmm）のみ可能
create table report_reactions (
  id uuid primary key default gen_random_uuid(),
  interview_report_id uuid not null references interview_report(id) on delete cascade,
  user_id uuid not null,
  reaction_type text not null check (reaction_type in ('helpful', 'hmm')),
  created_at timestamptz not null default now(),
  unique(interview_report_id, user_id)
);

-- RLS有効化（ポリシーなし = デフォルト全拒否、アクセスはAdmin Client経由のみ）
alter table report_reactions enable row level security;

-- パフォーマンス用インデックス
create index idx_report_reactions_report_id on report_reactions(interview_report_id);
create index idx_report_reactions_user_id on report_reactions(user_id);
