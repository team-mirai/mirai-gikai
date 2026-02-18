-- Add is_active flag to diet_sessions table
-- This flag determines which session's bills are displayed on the top page
-- Only one session should be active at a time (enforced by the RPC function)

ALTER TABLE diet_sessions
ADD COLUMN is_active boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN diet_sessions.is_active IS 'Whether this session is the active one displayed on the top page. Only one session can be active at a time.';

-- Atomic function to set a diet session as active
-- This ensures only one session can be active at a time, avoiding race conditions
-- SECURITY DEFINER allows this function to bypass RLS restrictions
CREATE OR REPLACE FUNCTION set_active_diet_session(target_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Single atomic UPDATE: set is_active based on whether id matches target
  UPDATE diet_sessions
  SET is_active = (id = target_session_id)
  -- WHERE clause required by Supabase on UPDATE queries
  -- https://supabase.com/docs/reference/javascript/update
  WHERE id IS NOT NULL;
END;
$$;
