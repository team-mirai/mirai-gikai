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
        showDeveloperTools: "never",
        // トップページの最外枠（body背景 = mirai-surface-light）と同じ色に合わせる
        customCss: `
          .scalar-api-reference {
            --scalar-background-1: var(--color-mirai-surface-light);
            --scalar-background-2: var(--color-mirai-surface-gray);
            --scalar-background-3: var(--color-mirai-surface-tag);
            --scalar-sidebar-background-1: var(--color-mirai-surface-light);
          }
        `,
      }}
    />
  );
}
