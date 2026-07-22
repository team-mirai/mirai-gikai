"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

/**
 * オープンデータAPIのOpenAPI仕様書ビューア。
 * 仕様書本体は /openapi/open-data-api.json（public配下）で配信する。
 */
export function OpenDataApiReference() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "/openapi/open-data-api.json",
        darkMode: false,
        hideDarkModeToggle: true,
        hideClientButton: true,
        hideModels: true,
        // コードサンプルは JavaScript(fetch) / Python(requests) / cURL / Go のみに絞る
        hiddenClients: {
          c: true,
          clojure: true,
          csharp: true,
          dart: true,
          elixir: true,
          fsharp: true,
          http: true,
          java: true,
          kotlin: true,
          node: true,
          objc: true,
          objectivec: true,
          ocaml: true,
          php: true,
          powershell: true,
          r: true,
          ruby: true,
          rust: true,
          swift: true,
          js: ["ofetch", "axios", "jquery", "xhr"],
          javascript: ["ofetch", "axios", "jquery", "xhr"],
          python: ["python3", "aiohttp", "httpx_sync", "httpx_async"],
          shell: ["httpie", "wget"],
        },
        showDeveloperTools: "never",
        // Team Mirai デザインシステム準拠: 白キャンバス + teal アクセント。
        // ミントは面積を絞り、サイドバーの1面のみに使う（パネル類はニュートラル）
        customCss: `
          .scalar-api-reference {
            --scalar-background-1: var(--color-white);
            --scalar-background-2: var(--color-mirai-surface-gray);
            --scalar-background-3: var(--color-mirai-surface-tag);
            --scalar-sidebar-background-1: var(--color-white);
            --scalar-color-accent: var(--color-mirai-brand-teal-hover);
          }
          /* イントロ右カラムの Server / Client Libraries カードは冗長なため非表示 */
          .scalar-api-reference .scalar-reference-intro-server,
          .scalar-api-reference .scalar-reference-intro-clients {
            display: none;
          }
          /* サイドバー検索行の末尾ボタン（Ask AI）を非表示 */
          .scalar-api-reference aside .px-3.pt-3 > button:last-child {
            display: none;
          }
          /* コード例フッターの Ask AI Agent ボタンを非表示 */
          .scalar-api-reference .agent-button-container {
            display: none;
          }
          /* サイドバー下部の Generate MCP を非表示 */
          .scalar-api-reference .scalar-mcp-layer {
            display: none;
          }
          /* "Test Request" ボタンのラベルを日本語化。
             ボタンはflexなので ::after をflexアイテムとして並べ、元ラベルは非表示にする */
          .scalar-api-reference .show-api-client-button > span:first-of-type {
            display: none;
          }
          .scalar-api-reference .show-api-client-button::after {
            content: "テストリクエスト";
          }
        `,
      }}
    />
  );
}
