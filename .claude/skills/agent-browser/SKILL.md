---
name: agent-browser
description: agent-browser CLIを使ったブラウザ操作のガイド。Webページの操作、スクレイピング、スクリーンショット取得などブラウザ自動化が必要なときに参照する。「ブラウザで開いて」「Webページを操作して」「スクリーンショットを撮って」と言われたらこのスキルを使う。
---

# agent-browser CLI ガイド

`agent-browser` はAIエージェント向けの高速ブラウザ自動化CLIツール。Bashツールから直接呼び出して使う。

## 基本ワークフロー

### 1. ページを開く → スナップショット → 操作 のループ

```bash
# ページを開く
agent-browser open "https://example.com"

# アクセシビリティツリーを取得（AI向け。@ref付きで要素を特定できる）
agent-browser snapshot -i  # -i: インタラクティブ要素のみ

# @ref を使って要素を操作
agent-browser click @e2
agent-browser fill @e3 "入力テキスト"

# 操作後に再度スナップショットで状態確認
agent-browser snapshot -i
```

**重要: 操作のたびに `snapshot -i` で現在の状態を確認すること。** ページの状態は操作ごとに変わるため、古い@refは無効になる可能性がある。

### 2. スナップショットのオプション

```bash
agent-browser snapshot              # フルツリー
agent-browser snapshot -i           # インタラクティブ要素のみ（推奨）
agent-browser snapshot -c           # コンパクト（空の構造要素を除去）
agent-browser snapshot -d 3         # 深さ制限
agent-browser snapshot -s "#main"   # CSSセレクタでスコープ限定
```

## コマンドリファレンス

### ナビゲーション

```bash
agent-browser open <url>       # URLに移動
agent-browser back             # 戻る
agent-browser forward          # 進む
agent-browser reload           # リロード
```

### クリック・入力

```bash
agent-browser click <sel>      # クリック（@ref またはCSSセレクタ）
agent-browser dblclick <sel>   # ダブルクリック
agent-browser type <sel> <text>  # テキスト入力（既存テキストに追加）
agent-browser fill <sel> <text>  # クリア後に入力（フォーム向け）
agent-browser press <key>      # キー押下（Enter, Tab, Control+a など）
agent-browser hover <sel>      # ホバー
agent-browser check <sel>      # チェックボックスON
agent-browser uncheck <sel>    # チェックボックスOFF
agent-browser select <sel> <val>  # ドロップダウン選択
```

### 情報取得

```bash
agent-browser get text <sel>   # テキスト取得
agent-browser get html <sel>   # HTML取得
agent-browser get value <sel>  # input値取得
agent-browser get attr <name> <sel>  # 属性取得
agent-browser get title        # ページタイトル
agent-browser get url          # 現在のURL
agent-browser get count <sel>  # 要素数
agent-browser get box <sel>    # 要素の位置・サイズ
```

### 要素の状態確認

```bash
agent-browser is visible <sel>   # 表示されているか
agent-browser is enabled <sel>   # 有効か
agent-browser is checked <sel>   # チェックされているか
```

### 要素検索（find）

セマンティックなロケーターで要素を探してアクションを実行：

```bash
agent-browser find role button click --name "送信"
agent-browser find text "ログイン" click
agent-browser find label "メールアドレス" fill "test@example.com"
agent-browser find placeholder "検索..." fill "キーワード"
agent-browser find testid "submit-btn" click
```

### スクリーンショット・PDF

```bash
agent-browser screenshot              # 画面キャプチャ（デフォルトパス）
agent-browser screenshot ./shot.png   # パス指定
agent-browser screenshot --full       # フルページ
agent-browser pdf ./page.pdf          # PDF保存
```

スクリーンショットを撮った後は `Read` ツールでファイルを読み取って画像を確認できる。

### スクロール

```bash
agent-browser scroll down        # 下にスクロール
agent-browser scroll up          # 上にスクロール
agent-browser scroll down 500    # 500pxスクロール
agent-browser scrollintoview <sel>  # 要素が見えるまでスクロール
```

### 待機

```bash
agent-browser wait <sel>    # 要素が表示されるまで待機
agent-browser wait 2000     # 2秒待機
```

### JavaScript実行

```bash
agent-browser eval "document.title"
agent-browser eval "document.querySelectorAll('a').length"
```

### タブ管理

```bash
agent-browser tab list     # タブ一覧
agent-browser tab new      # 新しいタブ
agent-browser tab 2        # 2番目のタブに切替
agent-browser tab close    # 現在のタブを閉じる
```

### ネットワーク

```bash
agent-browser network requests                    # リクエスト一覧
agent-browser network requests --filter "api"     # フィルタ
agent-browser network route "*/api/*" --abort      # リクエストブロック
agent-browser network unroute                      # ルート解除
```

### デバッグ

```bash
agent-browser console          # コンソールログ表示
agent-browser errors           # エラー表示
agent-browser highlight <sel>  # 要素ハイライト
agent-browser trace start      # トレース開始
agent-browser trace stop       # トレース停止
```

### ブラウザ設定

```bash
agent-browser set viewport 1280 720       # ビューポート設定
agent-browser set device "iPhone 15"      # デバイスエミュレーション
agent-browser set media dark              # ダークモード
agent-browser set offline on              # オフラインモード
agent-browser set headers '{"Authorization":"Bearer xxx"}'  # ヘッダー設定
```

### セッション管理

```bash
agent-browser --session mywork open "https://example.com"  # 名前付きセッション
agent-browser session list   # セッション一覧
```

セッションを指定すると、同じブラウザコンテキスト（Cookie等）を維持できる。

## よく使うパターン

### Webページの内容を読み取る

```bash
agent-browser open "https://example.com"
agent-browser snapshot -c  # コンパクトなツリーで内容確認
```

### フォームに入力して送信

```bash
agent-browser open "https://example.com/form"
agent-browser snapshot -i
# スナップショットの@refを使って操作
agent-browser fill @e1 "名前"
agent-browser fill @e2 "email@example.com"
agent-browser click @e3  # 送信ボタン
agent-browser wait 2000
agent-browser snapshot -i  # 結果確認
```

### ログインが必要なサイト

```bash
agent-browser --session auth open "https://example.com/login"
agent-browser --session auth snapshot -i
agent-browser --session auth fill @e1 "username"
agent-browser --session auth fill @e2 "password"
agent-browser --session auth click @e3
# 以降も同じセッションを使い続ける
agent-browser --session auth open "https://example.com/dashboard"
```

### スクリーンショットで視覚的に確認

```bash
agent-browser open "https://example.com"
agent-browser screenshot ./tmp_screenshot.png
# Readツールで画像を確認
```

## オプション

| オプション | 説明 |
|---|---|
| `--session <name>` | セッション名（Cookie等を維持） |
| `--headed` | ブラウザウィンドウを表示（デバッグ用） |
| `--json` | JSON形式で出力 |
| `--full`, `-f` | フルページスクリーンショット |
| `--cdp <port>` | Chrome DevTools Protocolで接続 |
| `--headers <json>` | HTTPヘッダーを設定 |
| `--debug` | デバッグ出力 |

## 注意事項

- **セレクタ**: `@ref`（スナップショットから取得）が最も確実。CSSセレクタも使える
- **セッション**: 同じセッション名を使えばCookieやログイン状態を維持できる
- **ヘッドレス**: デフォルトはヘッドレスモード。`--headed` で画面表示
- **初回実行**: ブラウザ未インストールなら `agent-browser install` を先に実行
