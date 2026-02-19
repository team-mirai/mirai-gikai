import { vi } from "vitest";

// 統合テストは Node.js 環境で実行するため、Next.js の "server-only"
// ガードを無効化する。これはビルド時チェックのバイパスであり、
// アプリケーションロジックのモックではない。
vi.mock("server-only", () => ({}));
