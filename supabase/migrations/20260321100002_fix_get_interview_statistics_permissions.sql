-- Restrict get_interview_statistics execution to service_role only
-- This function is admin-only and should not be callable by anon/authenticated
REVOKE EXECUTE ON FUNCTION public.get_interview_statistics(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_interview_statistics(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_interview_statistics(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_interview_statistics(UUID) TO service_role;
