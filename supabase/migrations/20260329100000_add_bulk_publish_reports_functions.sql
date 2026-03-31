-- レポート一括公開: 対象件数カウントと一括更新のDB関数

-- 対象件数カウント
create function count_bulk_publish_targets(
  p_config_id uuid,
  p_max_moderation_score integer,
  p_min_content_richness integer
) returns bigint as $$
  select count(*)
  from interview_report r
  join interview_sessions s on s.id = r.interview_session_id
  where s.interview_config_id = p_config_id
    and r.is_public_by_user = true
    and r.is_public_by_admin = false
    and r.moderation_score is not null
    and r.moderation_score <= p_max_moderation_score
    and r.total_content_richness is not null
    and r.total_content_richness >= p_min_content_richness;
$$ language sql stable;

-- 一括公開実行（更新件数を返す）
create function bulk_publish_reports(
  p_config_id uuid,
  p_max_moderation_score integer,
  p_min_content_richness integer
) returns bigint as $$
  with updated as (
    update interview_report r
    set is_public_by_admin = true
    from interview_sessions s
    where s.id = r.interview_session_id
      and s.interview_config_id = p_config_id
      and r.is_public_by_user = true
      and r.is_public_by_admin = false
      and r.moderation_score is not null
      and r.moderation_score <= p_max_moderation_score
      and r.total_content_richness is not null
      and r.total_content_richness >= p_min_content_richness
    returning r.id
  )
  select count(*) from updated;
$$ language sql volatile;
