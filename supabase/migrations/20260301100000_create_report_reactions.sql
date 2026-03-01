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

-- RLS有効化
alter table report_reactions enable row level security;

-- 認証ユーザーは自身のリアクションのみ参照可能（user_id漏洩防止）
-- カウント集計はadminクライアント経由で行うためRLS不要
create policy "Users can read own reactions" on report_reactions
  for select using (auth.uid() = user_id);

-- 認証ユーザー（匿名含む）は自身のリアクションを追加可能
create policy "Authenticated users can insert reactions" on report_reactions
  for insert with check (auth.uid() = user_id);

-- 自身のリアクションを更新可能
create policy "Users can update own reactions" on report_reactions
  for update using (auth.uid() = user_id);

-- 自身のリアクションを削除可能
create policy "Users can delete own reactions" on report_reactions
  for delete using (auth.uid() = user_id);

-- パフォーマンス用インデックス
create index idx_report_reactions_report_id on report_reactions(interview_report_id);
create index idx_report_reactions_user_id on report_reactions(user_id);
