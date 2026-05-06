---
name: push
description:
  現在のブランチの変更を origin に push し、対応する pull request を作成
  または更新する。push、更新の公開、pull request の作成を依頼されたときに使用する。
---

# Push

## 前提条件

- `gh` CLI がインストールされ `PATH` で利用可能。
- このリポジトリでの GitHub 操作のために `gh auth status` が成功する。

## ゴール

- 現在のブランチの変更を `origin` に安全に push する。
- ブランチ用の PR がない場合は作成、ある場合は既存の PR を更新する。
- リモートが進んでいるとき、ブランチの履歴をクリーンに保つ。

## 関連スキル

- `pull`: push が拒否されたり、同期がクリーンでない（non-fast-forward、マージコンフリクトのリスク、古いブランチ）ときに使用する。

## 手順

1. 現在のブランチを特定し、リモートの状態を確認する。
2. push 前にローカル検証（`make -C elixir all`）を実行する。
3. 必要に応じて upstream tracking を付けてブランチを `origin` に push する。設定済みのリモート URL をそのまま使う。
4. push がクリーンでない・拒否された場合:
   - 失敗が non-fast-forward や同期問題なら、`pull` スキルを実行して `origin/main` をマージし、コンフリクトを解決し、検証を再実行する。
   - 再度 push する。履歴を書き換えた場合のみ `--force-with-lease` を使う。
   - 設定済みリモートの認証・権限・ワークフロー制限による失敗の場合は、リモートを書き換えたりプロトコルを切り替えるワークアラウンドではなく、停止して正確なエラーをそのまま表面化する。

5. ブランチ用の PR が存在することを確認する:
   - PR がなければ作成する。
   - PR が存在し open ならそれを更新する。
   - ブランチがクローズ／マージ済みの PR に紐づいている場合、新しいブランチ + PR を作成する。
   - 変更の結果を明確に記述する適切な PR タイトルを書く。
   - ブランチ更新の場合、現在の PR タイトルが最新のスコープに合っているかを明示的に再考する。合わなくなっていれば更新する。
6. PR 本文を `.github/pull_request_template.md` に従って明示的に書く／更新する:
   - すべてのセクションをこの変更に合わせた具体的な内容で埋める。
   - すべてのプレースホルダコメント（`<!-- ... -->`）を置き換える。
   - テンプレートが期待する箇所では bullets/checkboxes を維持する。
   - PR が既に存在する場合、最新コミットだけでなくブランチ上のすべての意図された作業（追加・削除・アプローチ変更を含む）を反映するように本文をリフレッシュする。
   - 以前のイテレーションの古い説明文を再利用しない。
7. `mix pr_body.check` で PR 本文を検証し、報告されたすべての問題を修正する。
8. `gh pr view` の PR URL を返信する。

## コマンド

```sh
# ブランチを特定
branch=$(git branch --show-current)

# 最小の検証ゲート
make -C elixir all

# 初回 push: 現在の origin リモートを尊重する。
git push -u origin HEAD

# リモートが進んでいたために失敗した場合は pull スキルを使う。pull スキルでの解決と
# 再検証の後、通常の push を再試行する:
git push -u origin HEAD

# 設定済みリモートが認証・権限・ワークフロー制限で push を拒否した場合は、
# 停止して正確なエラーを表面化する。

# ローカルで履歴を書き換えた場合のみ:
git push --force-with-lease origin HEAD

# PR の存在を確認（無い場合のみ作成）
pr_state=$(gh pr view --json state -q .state 2>/dev/null || true)
if [ "$pr_state" = "MERGED" ] || [ "$pr_state" = "CLOSED" ]; then
  echo "現在のブランチはクローズ済みの PR に紐づいています。新しいブランチ + PR を作成してください。" >&2
  exit 1
fi

# 出荷される変更を要約する明確で人間にやさしいタイトルを書く。
pr_title="<この変更のための明確な PR タイトル>"
if [ -z "$pr_state" ]; then
  gh pr create --title "$pr_title"
else
  # ブランチ更新ごとにタイトルを再考。スコープが変わったら編集する。
  gh pr edit --title "$pr_title"
fi

# 検証前に PR 本文を .github/pull_request_template.md と一致するように書く／編集する。
# ワークフロー例:
# 1) テンプレートを開きこの PR の本文ドラフトを書く
# 2) gh pr edit --body-file /tmp/pr_body.md
# 3) ブランチ更新の場合、タイトル／本文が現在の diff と一致するか再確認

tmp_pr_body=$(mktemp)
gh pr view --json body -q .body > "$tmp_pr_body"
(cd elixir && mix pr_body.check --file "$tmp_pr_body")
rm -f "$tmp_pr_body"

# 返信用の PR URL を表示
gh pr view --json url -q .url
```

## ノート

- `--force` は使わない。`--force-with-lease` も最後の手段としてのみ使う。
- 同期問題とリモート認証／権限問題を区別する:
  - non-fast-forward や古いブランチの問題には `pull` スキルを使う。
  - 認証・権限・ワークフロー制限はリモートやプロトコルを変更するのではなく、そのまま表面化する。
