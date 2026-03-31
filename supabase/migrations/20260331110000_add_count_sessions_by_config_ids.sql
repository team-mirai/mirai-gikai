-- 複数のinterview_config_idに対するセッション数を一括取得するRPC関数
create or replace function count_sessions_by_config_ids(p_config_ids uuid[])
returns table (
  interview_config_id uuid,
  session_count bigint
)
language sql
stable
as $$
  select
    s.interview_config_id,
    count(s.id) as session_count
  from interview_sessions s
  where s.interview_config_id = any(p_config_ids)
  group by s.interview_config_id;
$$;
