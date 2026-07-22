-- Supabase CLI v2.106.0 以降でのローカル開発権限エラーへの対応 (#878)
--
-- CLI v2.106.0 の breaking change により `[api].auto_expose_new_tables` が
-- 未設定時 false となり、ローカルの start / db reset で public スキーマの
-- オブジェクトへの Data API 権限（anon / authenticated / service_role への
-- 自動 GRANT）が付与されなくなった。
-- そのため `pnpm db:reset` 後の `pnpm seed`（secret key = service_role）が
-- "permission denied for table tags" で失敗する。
--
-- 公式が案内する恒久対応は「アクセスすべきロールへ明示的に GRANT する」こと。
-- 本プロジェクトの public スキーマへのアクセスは全てサーバーサイド
-- （secret key = service_role）経由のため（AGENTS.md「RLSとアクセスパターン」）、
-- service_role のみに付与し、anon / authenticated / public からは明示的に
-- REVOKE して deny-by-default を権限レイヤーでも保証する。
-- （GRANT は他ロールの既存権限を削除しないため、旧仕様で自動付与された
--   環境に残る anon / authenticated への権限はここで明示的に取り除く）

-- 既存オブジェクト: anon / authenticated / public から取り除く
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- 既存オブジェクト: service_role へ付与
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- 今後のマイグレーション（postgres ロールで実行）で作成されるオブジェクト:
-- anon / authenticated / public への自動付与を止め、service_role のみ自動付与
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- 例外: is_admin() は storage.objects の RLS ポリシー評価（サムネイル
-- アップロード時に authenticated として実行）とクライアントからの RPC で
-- anon / authenticated からも実行されるため、EXECUTE を再付与する
-- （tests/supabase/db-function/is-admin.test.ts が この挙動を検証している）
grant execute on function public.is_admin() to anon, authenticated;
