-- インタビュー設定の論理削除に伴い、配下レポートを一括で公開停止するRPC関数
-- 設定削除時に呼び出し、対象configのセッションに紐づく公開レポートの
-- is_public_by_admin を false にする。
-- アプリ層でセッションIDを取得して .in() で更新する方式は PostgREST の
-- 行数上限（既定1000件）に引っかかるため、DB側の UPDATE ... FROM で一括更新する。
create or replace function unpublish_reports_by_config_id(p_config_id uuid)
returns void
language sql
as $$
  update interview_report r
  set is_public_by_admin = false
  from interview_sessions s
  where r.interview_session_id = s.id
    and s.interview_config_id = p_config_id
    and r.is_public_by_admin = true;
$$;
