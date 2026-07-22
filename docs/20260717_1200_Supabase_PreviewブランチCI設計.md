# Supabase Preview ブランチ CI 設計

`supabase/` 配下に変更がある open な PR に対してのみ、Supabase の preview ブランチ（独立した DB）を自動作成し、Vercel Preview から接続できるようにする仕組み。

- ワークフロー: `.github/workflows/supabase_preview.yml`
- 関連PR: #928（Vercel Preview を open な PR があるブランチのみに制限）

## 背景

feature ブランチの Vercel Preview は staging の Supabase を共有しているため、次の課題があった。

1. スキーマ変更（マイグレーション）を含む PR は staging に未適用のため Preview で動作しない
2. Preview からの書き込みが staging のデータを汚染する

Supabase Branching（preview ブランチ）を PR のライフサイクルに紐付けることで、スキーマ変更を含む PR だけ独立した DB を持てるようにする。

## 挙動

| PRイベント | supabase/ 変更あり | supabase/ 変更なし |
|---|---|---|
| opened / reopened | previewブランチ作成 → マイグレーション+seed適用 → Vercelのブランチ別環境変数を設定 → Preview再デプロイ | クリーンアップ（過去に作成したブランチ・環境変数が残っていれば削除） |
| synchronize（push） | マイグレーション再適用 + 環境変数再設定 + Preview再デプロイ（いずれも冪等。作成時の一時的な失敗から自動回復できるよう毎回実行）。ブランチ未作成なら作成から実施 | 同上（supabase/ 変更が途中で revert された PR の課金リークを防ぐ） |
| closed（マージ含む） | previewブランチ削除 + Vercelのブランチ別環境変数（本ワークフロー管理の4キーのみ）を削除 | 同左（作成していなければ何も起きない） |

- Supabase ブランチ名は「git ブランチ名を英数字とハイフンに正規化したもの（先頭40文字）+ `-pr<PR番号>`」。PR 番号を含めるのは、正規化による名前衝突（`feat/foo` と `feat-foo` 等）で別 PR のブランチを誤削除しないため
- fork からの PR は secrets を参照できないため対象外
- 途中から supabase/ 変更が入った PR は、その push（synchronize）のタイミングでブランチが作られる

## 必要な設定

### GitHub secrets（staging environment）

既存（deploy.yml と共用）:

- `SUPABASE_ACCESS_TOKEN`

新規追加が必要:

- `SUPABASE_MAIN_PROJECT_REF` … Supabase の**親プロジェクト（main ブランチ）の ref**。preview ブランチはこのプロジェクト配下（staging ブランチの兄弟）に作られる。既存の `SUPABASE_PROJECT_REF` は staging **ブランチ**の ref（deploy.yml の `supabase link` 用）であり、ブランチ ref に branches API を呼ぶと 403 になるため流用できない
- `VERCEL_TOKEN` … Vercel の API トークン（web/admin 両プロジェクトにアクセスできるスコープ）
- `VERCEL_TEAM_ID` … Vercel のチーム ID
- `WEB_VERCEL_PROJECT_ID` / `ADMIN_VERCEL_PROJECT_ID` … 各 Vercel プロジェクトの ID

### 段階的ロールアウト

ワークフローは実行の冒頭で前提条件（Branching が利用可能か・Vercel 系 secrets が設定済みか）をチェックし、未整備の場合は **警告を出して no-op** で成功する。このためワークフロー自体を先にマージし、後から secrets 設定・プラン変更を行っても既存 PR の CI は落ちない。

### Supabase 側の前提

- 本プロジェクトは「1つの Supabase プロジェクト + persistent ブランチ `staging`（develop に対応）」という Branching 前提の構成で運用されており、**Branching は有効化済み**（追加のプラン作業は不要）
- preview ブランチは親プロジェクト配下に `staging` ブランチと並ぶ形で作られる（設定は main = 本番から複製、データは引き継がない）
- 課金: preview ブランチは micro で **約 $0.01344/時**（≒ $0.32/日）。Compute Credits・Spend Cap の対象外。PR クローズで削除されるため、open な PR の数だけ課金される

## 環境変数のマッピング

`supabase branches get -o env` の出力を、アプリが参照する変数名にマッピングして Vercel に設定する（対象: Preview 環境・該当 git ブランチのみ）。

| Vercel に設定する変数 | ブランチ側の値 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_ANON_KEY`（legacy anon key。supabase-js は publishable key と同様に受け付ける） |
| `SUPABASE_URL` | `SUPABASE_URL` |
| `SUPABASE_SECRET_KEY` | `SUPABASE_SERVICE_ROLE_KEY`（legacy service role key） |

## 制約・注意点

- **初回実運用時に要確認**: `branches get -o env` の出力キーはワークフロー内で検証しており、想定と異なる場合は明示的に失敗する（Available keys がログに出る）。`branches get / delete` がブランチ名（ID ではなく）を受け付けることは初回実運用（PR #934）で確認済み
- **`branches get` の JSON に status は含まれない**: `branches get -o json` が返すのは接続情報のみ。ブランチの status（`ACTIVE_HEALTHY` 等）は `branches list -o json` からブランチ名で引く必要がある（初回実運用で待機ループが `unknown` のままタイムアウトした原因。修正済み）
- **Google 認証は動かない**: ブランチ DB には `supabase config push`（Google OAuth のリダイレクト URL 等）を適用していないため、認証が必要な画面の検証は staging 共有の Preview と同様の制約が残る
- **synchronize 時のレース**: push 直後は Vercel のビルドとマイグレーション適用が並行するため、ビルド完了直後の一瞬だけ新スキーマ未適用の可能性がある（リロードで解消）
- **データは seed のみ**: ブランチ DB は本番/staging のデータを引き継がず、`supabase/seed.sql` で初期化される（`--with-data` オプションは将来検討）
- **Storage は空**: ファイルアップロード系の検証には向かない

## 検証方法

1. secrets（`VERCEL_TOKEN` 等）を staging environment に設定する
2. `supabase/migrations/` にダミーのマイグレーションを含む PR を作成する
3. Actions の `Supabase Preview Branch` が成功し、Supabase ダッシュボードにブランチが作られることを確認する
4. Vercel Preview の環境変数（該当ブランチスコープ）が設定され、再デプロイ後の Preview がブランチ DB を向くことを確認する
5. PR をクローズし、ブランチと環境変数が削除されることを確認する
