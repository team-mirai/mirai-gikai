-- get_interview_statistics にフィードバックタグ集計を追加
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
  public_by_user_count bigint,
  feedback_irrelevant_questions bigint,
  feedback_not_aligned bigint,
  feedback_misunderstood bigint,
  feedback_too_many_questions bigint,
  feedback_other bigint
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
    count(case when r.is_public_by_user = true then 1 end) as public_by_user_count,
    -- フィードバックタグ集計
    (select count(*) from interview_rating_feedbacks f
     join interview_sessions fs on fs.id = f.interview_session_id
     where fs.interview_config_id = p_config_id
       and f.tag = 'irrelevant_questions') as feedback_irrelevant_questions,
    (select count(*) from interview_rating_feedbacks f
     join interview_sessions fs on fs.id = f.interview_session_id
     where fs.interview_config_id = p_config_id
       and f.tag = 'not_aligned') as feedback_not_aligned,
    (select count(*) from interview_rating_feedbacks f
     join interview_sessions fs on fs.id = f.interview_session_id
     where fs.interview_config_id = p_config_id
       and f.tag = 'misunderstood') as feedback_misunderstood,
    (select count(*) from interview_rating_feedbacks f
     join interview_sessions fs on fs.id = f.interview_session_id
     where fs.interview_config_id = p_config_id
       and f.tag = 'too_many_questions') as feedback_too_many_questions,
    (select count(*) from interview_rating_feedbacks f
     join interview_sessions fs on fs.id = f.interview_session_id
     where fs.interview_config_id = p_config_id
       and f.tag = 'other') as feedback_other
  from interview_sessions s
  left join interview_report r on r.interview_session_id = s.id
  left join (
    select im.interview_session_id, count(*) as message_count
    from interview_messages im
    group by im.interview_session_id
  ) mc on mc.interview_session_id = s.id
  where s.interview_config_id = p_config_id;
end;
$$ language plpgsql stable;
