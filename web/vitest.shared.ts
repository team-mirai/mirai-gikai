import { coverageConfigDefaults } from "vitest/config";

/**
 * 共通のカバレッジ除外パターン
 * vitest.config.mts と vitest.integration.config.mts の両方で使用
 */
export const coverageExclude = [
  ...coverageConfigDefaults.exclude,
  // vitest v4 でデフォルトの除外が空になったため、テストファイルを明示的に除外する。
  // （統合テストの実行では通常のテストファイルが計測対象に含まれてしまう）
  "**/*.test.{ts,tsx}",
  "**/*.d.ts",
  // shadcn/ui 自動生成ファイル
  "src/components/ui/**",
  // Next.js ルーティングの薄いラッパー
  "src/app/**/page.tsx",
  "src/app/**/layout.tsx",
  "src/app/**/loading.tsx",
  "src/app/**/not-found.tsx",
  "src/app/**/error.tsx",
  // 型定義のみ
  "**/types.ts",
  "**/types/index.ts",
  // テレメトリ・設定
  "src/lib/telemetry/**",
  "src/config/**",
];
