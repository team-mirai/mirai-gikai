-- 管理者がレポートを非公開にした判断を記録するカラム。
-- これまで is_public_by_admin = false は「まだ公開されていない」と
-- 「管理者が非公開にした」を区別できず、ユーザー操作（レポートの公開設定変更）に
-- 伴う自動公開が管理者の非公開判断を上書きできてしまっていた。
-- NULL = 管理者による非公開操作なし（従来どおり自動公開の対象）。
ALTER TABLE interview_report
  ADD COLUMN admin_unpublished_at TIMESTAMPTZ;

COMMENT ON COLUMN interview_report.admin_unpublished_at IS '管理者がレポートを非公開にした時刻（NULL=管理者による非公開操作なし）。NULL でない場合はユーザー操作による自動公開の対象外';

-- 既存データの移行:
-- 論理削除済みインタビュー設定の配下レポートは unpublish_reports_by_config_id で
-- 公開停止済み（未公開のものも公開対象外）のため、管理者判断として記録する。
-- is_public_by_admin は変更しないため、現在の公開状態は変わらない。
UPDATE interview_report r
SET admin_unpublished_at = now()
FROM interview_sessions s
JOIN interview_configs c ON c.id = s.interview_config_id
WHERE r.interview_session_id = s.id
  AND c.deleted_at IS NOT NULL
  AND r.admin_unpublished_at IS NULL;

-- 設定の論理削除に伴う一括公開停止でも管理者判断を記録する。
-- 併せて、まだ公開されていないレポートにも記録を残し、論理削除済み設定配下の
-- レポートがユーザー操作で公開されることを防ぐ。
create or replace function unpublish_reports_by_config_id(p_config_id uuid)
returns void
language sql
as $$
  update interview_report r
  set is_public_by_admin = false,
      admin_unpublished_at = now()
  from interview_sessions s
  where r.interview_session_id = s.id
    and s.interview_config_id = p_config_id
    and (r.is_public_by_admin = true or r.admin_unpublished_at is null);
$$;
