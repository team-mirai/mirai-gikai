# Cloud Run 実行基盤プロビジョニング（コード化）

トピック分析・意見再抽出バックフィルを実行する **Cloud Run Job** の GCP リソースを、
冪等な gcloud スクリプト [`provision.sh`](./provision.sh) で構築する。

手順の背景・各リソースの意味は
[docs/20260609_1230_トピック分析CloudRunプロビジョニング手順.md](../../docs/20260609_1230_トピック分析CloudRunプロビジョニング手順.md)
を参照（このスクリプトは同手順をコード化したもの）。

## 何を作るか

| リソース | 内容 |
| --- | --- |
| API | run / artifactregistry / secretmanager を有効化 |
| Artifact Registry | docker リポジトリ（既定 `topic-analysis`） |
| Secret Manager | `SUPABASE_URL` / `SUPABASE_SECRET_KEY` / `AI_GATEWAY_API_KEY` に **環境サフィックス**を付けたもの（例 `SUPABASE_URL_STAGING`）。**コンテナのみ**・値は別途 |
| SA: runtime | Job 実行用。secret 読み取り権限 |
| SA: invoker | admin が `jobs:run` を呼ぶ用。run.invoker + runtime への actAs |
| SA: deployer | CI（`deploy_worker.yml`）用。AR writer + run.developer + actAs |
| Cloud Run Job | `topic-analysis-worker-<DEPLOY_ENV>`（batch 向け設定）。**無ければ作成**、以後の image 更新は CI |

## 環境（staging / production）の分離

Secret Manager は **プロジェクトでグローバル（名前が一意）** なため、同一プロジェクトに
複数環境を置く場合は **Secret 名と Job 名を環境ごとに分離**する必要がある。
本スクリプトは必須の `DEPLOY_ENV`（例 `staging` / `production`）から自動で分離する。

- Secret 名: `SUPABASE_URL` → `SUPABASE_URL_<DEPLOY_ENV 大文字>`（例 `SUPABASE_URL_STAGING`）
- Job 名（既定）: `topic-analysis-worker-<DEPLOY_ENV>`
- worker が読む **環境変数名は固定**（`SUPABASE_URL` 等）。Job の `--set-secrets` が
  「`SUPABASE_URL=SUPABASE_URL_STAGING:latest`」のように環境別 Secret へマッピングする。

> ⚠️ `DEPLOY_ENV` を指定しないとエラーで停止する（環境を跨いで Secret を上書きする事故を防ぐため）。

**CI（`deploy_worker.yml`）との対応**: ワークフローは `main`→`topic-analysis-worker-production` /
`develop`→`topic-analysis-worker-staging` を既定 Job 名として更新する。provision 時に別名の Job を
作った場合は、各 GitHub Environment の Secret `GCP_TOPIC_ANALYSIS_JOB` を**その Job 名に合わせて**設定すること
（不一致だと `gcloud run jobs update` が `NOT_FOUND` で失敗する）。

**サービスアカウントの分離（任意）**: 既定では runtime / invoker / deployer SA は環境間で**共有**される
（runtime SA は `*_STAGING` と `*_PRODUCTION` の両 Secret にアクセス可能）。環境ごとに IAM を完全分離したい場合は
`RUNTIME_SA_NAME` / `INVOKER_SA_NAME` / `DEPLOYER_SA_NAME` を環境別の名前（例 `topic-analysis-runtime-staging`）で
上書きして実行する。

## 前提

- `gcloud` 認証済み（`gcloud auth login`）でプロジェクトへの権限がある。
- 初回 Job 作成でイメージをビルドする場合は `docker` が必要（`WORKER_IMAGE` を渡せば不要）。

## 使い方

```bash
# 1. 設定（実値は config.env に。config.env* は gitignore 済み）
cp infra/cloud-run/config.example.env infra/cloud-run/config.env
$EDITOR infra/cloud-run/config.env        # GCP_PROJECT_ID と DEPLOY_ENV は必須

# 2. 実行（冪等。何度実行しても安全）
bash infra/cloud-run/provision.sh
```

環境を分けて運用する場合は、環境別の設定ファイルを `CONFIG_FILE` で指定する（いずれも gitignore 対象）:

```bash
cp infra/cloud-run/config.example.env infra/cloud-run/config.env.staging      # DEPLOY_ENV=staging + staging 値
cp infra/cloud-run/config.example.env infra/cloud-run/config.env.production    # DEPLOY_ENV=production + 本番値

CONFIG_FILE=infra/cloud-run/config.env.staging    bash infra/cloud-run/provision.sh
CONFIG_FILE=infra/cloud-run/config.env.production bash infra/cloud-run/provision.sh
```

## OSS・セキュリティ上の約束

- **project ID・secret 値・SA キーはコミットしない**。すべて `config.env`（gitignore 済み）や
  env 経由で注入する。スクリプト本体には汎用のリソース名のデフォルトしか書かない。
- **secret の値**は既定では投入しない（空コンテナだけ作る）。一括投入したい場合のみ
  `SECRET_VALUE_<NAME>` を `config.env` に設定する。
- **SA キーの発行**は既定で無効。`GENERATE_KEYS=1` のときだけ発行し、Vercel/GitHub へ登録後に
  ローカルの鍵ファイル（`*-key.json`・gitignore 済み）を必ず削除する。

## 冪等性

- 既存リソースは `describe` で検知して skip（API 有効化・IAM binding は元来冪等）。
- Cloud Run Job は「無ければ作成」のみ。**イメージ差し替えは CI（`deploy_worker.yml`）**が担うため、
  既存 Job には触れない。

## 関連

- イメージの build/push と Job 更新の CI: [`.github/workflows/deploy_worker.yml`](../../.github/workflows/deploy_worker.yml)
- worker 本体: [`worker/`](../../worker)
