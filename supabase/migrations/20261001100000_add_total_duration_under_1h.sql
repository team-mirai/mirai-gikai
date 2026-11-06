-- get_interview_statistics / get_interview_metrics_by_bill に
-- 「1時間以上のセッションを除外した総所要時間（total_duration_seconds_under_1h）」を追加する。
-- 放置されたまま後から再開・完了したセッション等の外れ値で総所要時間が過大になるのを避けるための指標。
--
-- セッションの所要時間の定義は既存の total_duration_seconds と同じ:
--   完了セッション: completed_at - started_at
--   途中離脱セッション: 最後のメッセージ created_at - started_at
--   メッセージが無い未完了セッションは集計から除外
-- このうち所要時間が1時間未満のセッションのみを合算する。
-- ※ 所要時間の定義と1時間（3600秒）の閾値は2関数で重複しているため、変更時は両方を揃えること。
--
-- RETURNS TABLE に列を追加するため、CREATE OR REPLACE ではなく DROP してから作り直す。

drop function if exists get_interview_statistics(uuid);

create function get_interview_statistics(p_config_id uuid)
returns table (
  total_sessions bigint,
  completed_sessions bigint,
  avg_rating numeric,
  stance_for_count bigint,
  stance_against_count bigint,
  stance_neutral_count bigint,
  avg_total_content_richness numeric,
  role_subject_expert_count bigint,
  role_work_related_count bigint,
  role_daily_life_affected_count bigint,
  role_general_citizen_count bigint,
  avg_message_count numeric,
  median_duration_seconds numeric,
  total_duration_seconds numeric,
  total_duration_seconds_under_1h numeric,
  public_by_user_count bigint,
  feedback_irrelevant_questions bigint,
  feedback_not_aligned bigint,
  feedback_misunderstood bigint,
  feedback_too_many_questions bigint,
  feedback_other bigint,
  total_cost_usd numeric,
  avg_cost_usd numeric
) as $$
begin
  return query
  select
    count(s.id) as total_sessions,
    count(s.completed_at) as completed_sessions,
    round(avg(s.rating)::numeric, 2) as avg_rating,
    count(case when r.stance = 'for' then 1 end) as stance_for_count,
    count(case when r.stance = 'against' then 1 end) as stance_against_count,
    count(case when r.stance = 'neutral' then 1 end) as stance_neutral_count,
    round(avg(r.total_content_richness)::numeric, 1) as avg_total_content_richness,
    count(case when r.role = 'subject_expert' then 1 end) as role_subject_expert_count,
    count(case when r.role = 'work_related' then 1 end) as role_work_related_count,
    count(case when r.role = 'daily_life_affected' then 1 end) as role_daily_life_affected_count,
    count(case when r.role = 'general_citizen' then 1 end) as role_general_citizen_count,
    round(avg(coalesce(mc.message_count, 0))::numeric, 1) as avg_message_count,
    round(
      (select percentile_cont(0.5) within group (
        order by extract(epoch from (sub.completed_at - sub.started_at))
      )
      from interview_sessions sub
      where sub.interview_config_id = p_config_id
        and sub.completed_at is not null
      )::numeric, 0
    ) as median_duration_seconds,
    -- 総所要時間: 完了セッションは completed_at、途中離脱は最終メッセージ時刻を終了時刻として集計
    -- メッセージが無い未完了セッションは duration を算出できないため除外
    coalesce(max(dur.total_seconds), 0)::numeric as total_duration_seconds,
    -- 1時間以上のセッションを除外した総所要時間
    coalesce(max(dur.total_seconds_under_1h), 0)::numeric as total_duration_seconds_under_1h,
    count(case when r.is_public_by_user = true then 1 end) as public_by_user_count,
    -- フィードバックタグ集計
    coalesce(max(fc.feedback_irrelevant_questions), 0) as feedback_irrelevant_questions,
    coalesce(max(fc.feedback_not_aligned), 0) as feedback_not_aligned,
    coalesce(max(fc.feedback_misunderstood), 0) as feedback_misunderstood,
    coalesce(max(fc.feedback_too_many_questions), 0) as feedback_too_many_questions,
    coalesce(max(fc.feedback_other), 0) as feedback_other,
    -- コスト集計
    coalesce(max(cc.total_cost), 0)::numeric as total_cost_usd,
    case
      when count(s.id) > 0 then round(coalesce(max(cc.total_cost), 0)::numeric / count(s.id), 6)
      else 0::numeric
    end as avg_cost_usd
  from interview_sessions s
  left join interview_report r on r.interview_session_id = s.id
  left join (
    select im.interview_session_id, count(*) as message_count
    from interview_messages im
    group by im.interview_session_id
  ) mc on mc.interview_session_id = s.id
  left join (
    select
      sum(d.seconds) as total_seconds,
      sum(d.seconds) filter (where d.seconds < 3600) as total_seconds_under_1h
    from (
      select extract(epoch from (
        coalesce(sub.completed_at, lm.last_message_at) - sub.started_at
      )) as seconds
      from interview_sessions sub
      left join (
        select im.interview_session_id, max(im.created_at) as last_message_at
        from interview_messages im
        group by im.interview_session_id
      ) lm on lm.interview_session_id = sub.id
      where sub.interview_config_id = p_config_id
        and coalesce(sub.completed_at, lm.last_message_at) is not null
    ) d
  ) dur on true
  left join (
    select
      count(*) filter (where f.tag = 'irrelevant_questions') as feedback_irrelevant_questions,
      count(*) filter (where f.tag = 'not_aligned') as feedback_not_aligned,
      count(*) filter (where f.tag = 'misunderstood') as feedback_misunderstood,
      count(*) filter (where f.tag = 'too_many_questions') as feedback_too_many_questions,
      count(*) filter (where f.tag = 'other') as feedback_other
    from interview_rating_feedbacks f
    join interview_sessions fs on fs.id = f.interview_session_id
    where fs.interview_config_id = p_config_id
  ) fc on true
  left join (
    select sum(c.cost_usd) as total_cost
    from chat_usage_events c
    join interview_sessions cs on cs.id::text = c.session_id
    where cs.interview_config_id = p_config_id
  ) cc on true
  where s.interview_config_id = p_config_id;
end;
$$ language plpgsql stable;

-- function を drop すると権限もリセットされるため、admin-only 権限を再付与
revoke execute on function public.get_interview_statistics(uuid) from public;
revoke execute on function public.get_interview_statistics(uuid) from anon;
revoke execute on function public.get_interview_statistics(uuid) from authenticated;
grant execute on function public.get_interview_statistics(uuid) to service_role;

drop function if exists get_interview_metrics_by_bill(uuid);

create function get_interview_metrics_by_bill(p_bill_id uuid default null)
returns table (
  bill_id uuid,
  bill_name text,
  conducted_count bigint,
  completed_count bigint,
  completion_rate numeric,
  total_duration_seconds numeric,
  total_duration_seconds_under_1h numeric
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
    round(coalesce(sum(d.seconds), 0)::numeric, 0) as total_duration_seconds,
    round(
      coalesce(sum(d.seconds) filter (where d.seconds < 3600), 0)::numeric,
      0
    ) as total_duration_seconds_under_1h
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
  left join lateral (
    select extract(
      epoch from (coalesce(s.completed_at, lm.last_message_at) - s.started_at)
    ) as seconds
  ) d on true
  where p_bill_id is null or b.id = p_bill_id
  group by b.id, b.name
  order by count(s.id) desc, b.name;
$$;

comment on function get_interview_metrics_by_bill(uuid) is
  '議案ごとのAIインタビュー実施数・完了数・完了率・総回答時間（秒）・1時間以上のセッションを除外した総回答時間（秒）を集計する。論理削除済み設定は除外。p_bill_idで単一議案に絞り込める。';

revoke execute on function public.get_interview_metrics_by_bill(uuid) from public;
revoke execute on function public.get_interview_metrics_by_bill(uuid) from anon;
revoke execute on function public.get_interview_metrics_by_bill(uuid) from authenticated;
grant execute on function public.get_interview_metrics_by_bill(uuid) to service_role;
