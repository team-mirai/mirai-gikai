-- team-mir.ai ドメインの Google ログインユーザーに admin ロールを付与する関数
-- トリガーから呼ばれるが、テスト用に直接呼び出しも可能
CREATE OR REPLACE FUNCTION public.apply_admin_role_if_eligible(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_email text;
  user_provider text;
  current_roles jsonb;
BEGIN
  SELECT email, raw_app_meta_data->>'provider', raw_app_meta_data->'roles'
  INTO user_email, user_provider, current_roles
  FROM auth.users WHERE id = target_user_id;

  IF user_email ILIKE '%@team-mir.ai'
    AND user_provider = 'google'
    AND (current_roles IS NULL OR NOT current_roles @> '["admin"]')
  THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{roles}',
      COALESCE(raw_app_meta_data->'roles', '[]'::jsonb) || '["admin"]'::jsonb
    )
    WHERE id = target_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー関数: AFTER INSERT で上記関数を呼び出す
CREATE OR REPLACE FUNCTION public.handle_google_workspace_admin_role()
RETURNS trigger AS $$
BEGIN
  PERFORM public.apply_admin_role_if_eligible(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_set_admin_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_google_workspace_admin_role();

-- 既存の team-mir.ai Google ログインユーザーにも admin ロールを付与
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{roles}',
  COALESCE(raw_app_meta_data->'roles', '[]'::jsonb) || '["admin"]'::jsonb
)
WHERE email ILIKE '%@team-mir.ai'
  AND raw_app_meta_data->>'provider' = 'google'
  AND (
    raw_app_meta_data->'roles' IS NULL
    OR NOT raw_app_meta_data->'roles' @> '["admin"]'
  );
