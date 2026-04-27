-- team-mir.ai ドメインの Google ログインユーザーに自動で admin ロールを付与するトリガー
CREATE OR REPLACE FUNCTION public.handle_google_workspace_admin_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.email LIKE '%@team-mir.ai'
    AND NEW.raw_app_meta_data->>'provider' = 'google'
  THEN
    NEW.raw_app_meta_data = jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{roles}',
      '["admin"]'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_set_admin_role
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_google_workspace_admin_role();

-- 既存の team-mir.ai Google ログインユーザーにも admin ロールを付与
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{roles}',
  '["admin"]'
)
WHERE email LIKE '%@team-mir.ai'
  AND raw_app_meta_data->>'provider' = 'google'
  AND (
    raw_app_meta_data->'roles' IS NULL
    OR NOT raw_app_meta_data->'roles' @> '["admin"]'
  );
