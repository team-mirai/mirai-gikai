---
description: "Chrome DevTools MCPを使ってUI問題をデバッグする"
---

## 引数

$ARGUMENTS

## 前提条件

- Chrome DevTools MCP (`mcp__chrome-devtools__*`) が利用可能であること
- ローカル開発サーバーが起動していること

Chrome DevTools MCPが設定されてない場合は、以下のコマンドでセットアップします。
`claude mcp add chrome-devtools npx chrome-devtools-mcp@latest`

## タスク

Chrome DevTools MCPを使ってUI問題を特定・修正します。

### 1. 問題の確認

引数またはユーザーからの情報を整理：
- **対象URL**: デバッグするページ
- **問題の種類**: レイアウト崩れ、はみ出し、表示されない、スタイル不正など
- **再現条件**: 画面サイズ、操作手順など

### 2. 環境のセットアップ

```javascript
// ページを開く
mcp__chrome-devtools__new_page({ url: "<対象URL>" })

// 必要に応じてビューポートをエミュレート
mcp__chrome-devtools__emulate({
  viewport: { width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true }  // iPhone SE
  // viewport: { width: 375, height: 812, ... }  // iPhone X
  // viewport: { width: 768, height: 1024, ... } // iPad
  // viewport: null  // リセット
})
```

### 3. 問題タイプ別の診断

#### 3.1 横はみ出し・横スクロール問題

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const vw = window.innerWidth;
    const sw = document.body.scrollWidth;
    if (sw <= vw) return { ok: true, message: '横はみ出しなし' };

    // 原因要素を特定
    let maxRight = 0, culprit = null;
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > maxRight) {
        maxRight = r.right;
        culprit = { tag: el.tagName, class: el.className?.slice(0,80), right: Math.round(r.right) };
      }
    });
    return { ok: false, viewportWidth: vw, scrollWidth: sw, culprit };
  }`
})
```

#### 3.2 要素が見つからない・表示されない

```javascript
// スナップショットでDOM構造を確認
mcp__chrome-devtools__take_snapshot()

// 特定のセレクタで要素を探す
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const el = document.querySelector('<セレクタ>');
    if (!el) return { found: false };
    const style = getComputedStyle(el);
    return {
      found: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      rect: el.getBoundingClientRect()
    };
  }`
})
```

#### 3.3 スタイル・レイアウトの確認

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(el) => {
    const style = getComputedStyle(el);
    return {
      width: style.width,
      height: style.height,
      padding: style.padding,
      margin: style.margin,
      display: style.display,
      position: style.position,
      overflow: style.overflow
    };
  }`,
  args: [{ uid: "<要素のuid>" }]
})
```

### 4. 二分探索による原因特定

問題の原因コンポーネントが不明な場合、コメントアウトで絞り込む：

1. 対象ファイルを特定（ページのコンポーネント）
2. **半分をコメントアウト** → リロード → 問題確認
3. 問題が解消 → コメントアウト部分に原因
4. 問題が継続 → 残り部分に原因
5. 繰り返して原因コンポーネントを特定

```javascript
// リロードして確認
mcp__chrome-devtools__navigate_page({ type: "reload" })
```

### 5. 修正と確認

#### よくある修正パターン

| 問題 | 原因例 | 修正 |
|------|--------|------|
| 横はみ出し | 固定幅 `w-[756px]` | `max-w-[756px] w-full` |
| 横はみ出し | `inline-flex` | 親に `overflow-x-auto` |
| 横はみ出し | コンテナ幅超過 | `w-full` を追加 |
| 要素が見切れる | `overflow: hidden` | `overflow: visible` or 削除 |
| レスポンシブ崩れ | 固定パディング | `p-4 sm:p-6` |

#### 修正後の確認

```javascript
mcp__chrome-devtools__navigate_page({ type: "reload" })
mcp__chrome-devtools__take_screenshot({ filePath: "./screenshot-fixed.png" })
```

### 6. 完了報告

```markdown
## デバッグ完了

### 問題
<問題の説明>

### 原因
<原因の要素・スタイル>

### 修正
<変更内容>

### 確認
<スクリーンショットまたは確認結果>
```
