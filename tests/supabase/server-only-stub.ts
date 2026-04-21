// `server-only` パッケージの vitest 解決用 stub。
// 本体は非 react-server 環境で import すると throw するため、
// admin/src 配下のサーバ専用モジュールを統合テストから import できるよう、
// vitest の alias でこの空ファイルに差し替える。
// （テスト対象ロジックをモックしているわけではなく、Next.js のランタイム
// ガードを無効化しているだけ）
