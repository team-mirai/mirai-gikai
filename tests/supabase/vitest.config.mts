import path from "node:path";
import { defineConfig } from "vitest/config";

const testsDir = path.resolve(__dirname);

export default defineConfig({
  test: {
    globals: true,
    root: testsDir,
    include: ["**/*.test.ts"],
    // テスト間のデータ干渉を防ぐためシーケンシャル実行
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globalSetup: [path.resolve(testsDir, "setup.ts")],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@mirai-gikai/supabase": path.resolve(
        __dirname,
        "../../packages/supabase/src"
      ),
    },
  },
});
