-- get_admin_users() の権限修正
-- Supabase の ALTER DEFAULT PRIVILEGES により anon/authenticated にも
-- EXECUTE が自動付与されるため、REVOKE FROM public だけでは不十分。
-- anon/authenticated からも明示的に REVOKE する。
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM authenticated;
