-- get_interview_metrics_by_bill に総回答時間（total_duration_seconds）を追加する。
-- 既存の実施数・完了数・完了率に加え、議案ごとに回答へ費やされた総時間（秒）を返す。
--
-- 総回答時間の定義（get_interview_statistics の total_duration_seconds と揃える）:
--   完了セッション: completed_at - started_at
--   途中離脱セッション: 最後のメッセージ created_at - started_at
--   メッセージが無い未完了セッションは終了時刻を確定できないため集計から除外する
-- 秒単位・小数第0位で丸め、集計対象が無い議案は0とする。
--
-- RETURNS TABLE に列を追加するため、CREATE OR REPLACE ではなく DROP してから作り直す。
drop function if exists get_interview_metrics_by_bill(uuid);

create function get_interview_metrics_by_bill(p_bill_id uuid default null)
returns table (
  bill_id uuid,
  bill_name text,
  conducted_count bigint,
  completed_count bigint,
  completion_rate numeric,
  total_duration_seconds numeric
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
    end as completion_rate,
    round(
      coalesce(
        sum(
          extract(
            epoch from (coalesce(s.completed_at, lm.last_message_at) - s.started_at)
          )
        ),
        0
      )::numeric,
      0
    ) as total_duration_seconds
  from bills b
  join interview_configs c
    on c.bill_id = b.id
   and c.deleted_at is null
  left join interview_sessions s
    on s.interview_config_id = c.id
  left join (
    select im.interview_session_id, max(im.created_at) as last_message_at
    from interview_messages im
    group by im.interview_session_id
  ) lm
    on lm.interview_session_id = s.id
  where p_bill_id is null or b.id = p_bill_id
  group by b.id, b.name
  order by count(s.id) desc, b.name;
$$;

comment on function get_interview_metrics_by_bill(uuid) is
  '議案ごとのAIインタビュー実施数・完了数・完了率・総回答時間（秒）を集計する。論理削除済み設定は除外。p_bill_idで単一議案に絞り込める。';
