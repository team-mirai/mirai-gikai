-- 議案ごとの公開レポート件数をまとめて数える。
--
-- 法案一覧では議案ごとに回答数バッジを出すため、議案数ぶんの count クエリを
-- 並べると一覧の表示で数十回叩くことになる。1クエリで済むようにDB側で集約する。
-- 公開の定義は countPublicReportsByBillId と同じ（管理者公開 × ユーザー公開）。
--
-- count(id) ではなく count(*) にする。where 句が idx_interview_report_public_session
-- の述語と一致するので、id を読まなければ index only scan に載る。
-- interview_report.interview_session_id は UNIQUE で join が行を増やさないため、
-- count(*) と count(id) は同義。
create or replace function public.count_public_reports_by_bill_ids(p_bill_ids uuid[])
returns table (
  bill_id uuid,
  report_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.bill_id,
    count(*) as report_count
  from interview_report r
  join interview_sessions s on s.id = r.interview_session_id
  join interview_configs c on c.id = s.interview_config_id
  where c.bill_id = any(p_bill_ids)
    and r.is_public_by_admin
    and r.is_public_by_user
  group by c.bill_id;
$$;

comment on function public.count_public_reports_by_bill_ids(uuid[]) is
  '議案ごとの公開レポート件数（管理者公開 × ユーザー公開）をまとめて返す。法案一覧の回答数バッジ用。';
