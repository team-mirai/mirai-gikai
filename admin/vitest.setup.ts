import { vi } from "vitest";

// Next.js の "server-only" パッケージをモック
// サーバー専用ファイルのユニットテストで必要
vi.mock("server-only", () => ({}));
