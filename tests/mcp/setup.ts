import { vi } from "vitest";

// MCPツールは "server-only" を import しているため、テスト環境では空モジュールに差し替える。
vi.mock("server-only", () => ({}));

// Web キャッシュ無効化はテストでは不要。REVALIDATE_SECRET を未設定にすると
// invalidateWebCache が早期 return し、ローカルで web が起動していなくてもテストが走る。
delete process.env.REVALIDATE_SECRET;
