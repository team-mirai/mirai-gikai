-- admin管理画面用: admin権限を持つユーザー一覧をDBレイヤーでフィルタして返す
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.email, u.created_at, u.last_sign_in_at
  FROM auth.users u
  WHERE u.raw_app_meta_data->'roles' ? 'admin'
  ORDER BY u.created_at DESC;
$$;

-- service_role のみ実行可能にし、anon/authenticated からのアクセスを遮断
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO service_role;
