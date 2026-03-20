import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "./routes";

/**
 * app/ ディレクトリの page.tsx を再帰走査し、
 * ルートグループ (protected) を除去した有効ルートパターンを返す。
 */
function collectAppRoutes(appDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "page.tsx") {
        const rel = path.relative(appDir, dir);
        // ルートグループ除去: (protected) など
        const route =
          `/${rel.replace(/\([^)]+\)\/?/g, "")}`.replace(/\/+$/, "") || "/";
        results.push(route);
      }
    }
  }

  walk(appDir);
  return results.sort();
}

/**
 * routes オブジェクトの各関数を呼び出し、
 * 動的セグメントを [param] に正規化したパターンを返す。
 */
function collectDefinedRoutes(): string[] {
  const patterns: string[] = [];

  for (const [, fn] of Object.entries(routes)) {
    const routeFn = fn as (...args: string[]) => string;
    // 関数のarity分のダミー引数を生成
    const args = Array.from(
      { length: routeFn.length },
      (_, i) => `__PARAM_${i}__`
    );
    const result = routeFn(...args);
    // クエリパラメータ除去
    const withoutQuery = result.split("?")[0];
    // ダミー引数 → [param] に変換
    const normalized = withoutQuery.replace(/__PARAM_\d+__/g, "[param]");
    if (!patterns.includes(normalized)) {
      patterns.push(normalized);
    }
  }

  return patterns.sort();
}

/**
 * app/ のルートパターンを正規化 (動的セグメント [xxx] → [param])
 */
function normalizeAppRoute(route: string): string {
  return route.replace(/\[[^\]]+\]/g, "[param]");
}

describe("routes", () => {
  const appDir = path.resolve(__dirname, "../app");
  const appRoutes = collectAppRoutes(appDir);
  const definedRoutes = collectDefinedRoutes();

  // app/ の正規化済みルート (API ルートと / を除外)
  const normalizedAppRoutes = appRoutes
    .filter((r) => !r.startsWith("/api") && r !== "/")
    .map(normalizeAppRoute)
    .sort();

  it("routes.ts の全ルートが app/ 内の page.tsx に対応している", () => {
    const missing = definedRoutes.filter(
      (r) => !normalizedAppRoutes.includes(normalizeAppRoute(r))
    );
    if (missing.length > 0) {
      expect.fail(
        `routes.ts に定義されているが page.tsx が存在しないルート:\n${missing.map((r) => `  - ${r}`).join("\n")}`
      );
    }
  });

  it("app/ 内の全 page.tsx が routes.ts に定義されている", () => {
    const missing = normalizedAppRoutes.filter(
      (r) => !definedRoutes.map(normalizeAppRoute).includes(r)
    );
    if (missing.length > 0) {
      expect.fail(
        `page.tsx が存在するが routes.ts に未定義のルート:\n${missing.map((r) => `  - ${r}`).join("\n")}`
      );
    }
  });
});
