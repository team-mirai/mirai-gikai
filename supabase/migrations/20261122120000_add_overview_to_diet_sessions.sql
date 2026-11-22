ALTER TABLE diet_sessions
ADD COLUMN overview text;

COMMENT ON COLUMN diet_sessions.overview IS 'トップページに表示する会期の説明';
