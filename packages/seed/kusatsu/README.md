# 草津市議会データの一括更新

既存の議案IDを維持したまま、議案情報と `normal` / `hard` の本文をCSVから
一括更新します。既存データを全削除する `seed:csv` とは用途が異なります。

## 更新手順

Supabaseを起動した状態で、リポジトリのルートから実行します。

```powershell
# 現在のDBから編集用CSVを書き出す
pnpm kusatsu:bills:export

# 令和8年2月定例会の公式資料を基にCSVを更新する
pnpm kusatsu:bills:prepare

# CSVとDBの整合性だけを検査する（DBは変更しない）
pnpm kusatsu:bills:update

# バックアップを保存してDBへ反映する
pnpm kusatsu:bills:update -- --apply
```

編集用CSVは `data/bills-update.csv`、適用前バックアップは
`.local-data/kusatsu-backups/` に保存されます。どちらも環境固有のIDや
ローカルデータを含むため、Gitの管理対象外です。

## 状態の対応

- `introduced`: 提出済み
- `in_originating_house`: 審議中
- `enacted`: 可決・承認
- `rejected`: 否決
- `preparing`: 準備中

地方議会の「原案可決」や「承認」は `enacted` を使用し、正確な結果を
`status_note` に記録します。
