-- 議案ごとのAIインタビュー実施状況（実施数・完了数・完了率）を集計するRPC関数。
-- admin MCP tool (get_interview_metrics_by_bill) から利用する。
--
-- 定義:
--   実施数 (conducted_count): interview_sessions の総数（開始されたセッション。archived含む）
--   完了数 (completed_count): completed_at が設定されたセッション数
--   完了率 (completion_rate): completed_count / conducted_count（0〜1、小数第3位で丸め。実施0件は0）
--
-- 論理削除済みの設定（interview_configs.deleted_at IS NOT NULL）は除外する。
-- 1議案に複数の設定がある場合は設定を跨いで合算する。
-- p_bill_id を指定するとその議案のみ、NULL（未指定）なら設定を持つ全議案を返す。
create or replace function get_interview_metrics_by_bill(p_bill_id uuid default null)
returns table (
  bill_id uuid,
  bill_name text,
  conducted_count bigint,
  completed_count bigint,
  completion_rate numeric
)
language sql
stable
as $$
  select
    b.id as bill_id,
    b.name as bill_name,
    count(s.id) as conducted_count,
    count(s.completed_at) as completed_count,
    case
      when count(s.id) = 0 then 0
      else round(count(s.completed_at)::numeric / count(s.id)::numeric, 3)
    end as completion_rate
  from bills b
  join interview_configs c
    on c.bill_id = b.id
   and c.deleted_at is null
  left join interview_sessions s
    on s.interview_config_id = c.id
  where p_bill_id is null or b.id = p_bill_id
  group by b.id, b.name
  order by count(s.id) desc, b.name;
$$;

comment on function get_interview_metrics_by_bill(uuid) is
  '議案ごとのAIインタビュー実施数・完了数・完了率を集計する。論理削除済み設定は除外。p_bill_idで単一議案に絞り込める。';
