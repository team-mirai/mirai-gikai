-- 複数レポートのリアクション数をDB側で集約して返すRPC関数
create or replace function count_reactions_by_report_ids(report_ids uuid[])
returns table (
  interview_report_id uuid,
  reaction_type text,
  cnt bigint
)
language sql
stable
as $$
  select
    r.interview_report_id,
    r.reaction_type,
    count(*) as cnt
  from report_reactions r
  where r.interview_report_id = any(report_ids)
  group by r.interview_report_id, r.reaction_type;
$$;
