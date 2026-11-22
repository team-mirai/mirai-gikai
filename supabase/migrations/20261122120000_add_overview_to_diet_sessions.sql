ALTER TABLE diet_sessions
ADD COLUMN overview text;

ALTER TABLE diet_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN diet_sessions.overview IS 'トップページに表示する会期の説明';
