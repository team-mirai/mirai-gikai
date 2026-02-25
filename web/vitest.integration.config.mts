import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.integration.test.ts"],
    setupFiles: [path.resolve(__dirname, "vitest.integration.setup.ts")],
    // テスト間のデータ干渉を防ぐためシーケンシャル実行
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary"],
      reportsDirectory: "./coverage-integration",
      exclude: [
        "src/components/ui/**",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/not-found.tsx",
        "src/app/**/error.tsx",
        "**/types.ts",
        "**/types/index.ts",
        "src/lib/telemetry/**",
        "src/config/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@mirai-gikai/supabase": path.resolve(
        __dirname,
        "../packages/supabase/src"
      ),
      "@test-utils": path.resolve(__dirname, "../tests/supabase"),
    },
  },
});
