import { vi } from "vitest";

// 統合テストは Node.js 環境で実行するため、Next.js の "server-only"
// ガードを無効化する。これはビルド時チェックのバイパスであり、
// アプリケーションロジックのモックではない。
vi.mock("server-only", () => ({}));

// 統合テストはリクエストスコープ外で実行するため、Next.js の
// cookies()/headers() を空のスタブに置き換える。
// アプリケーションロジックのモックではなく、フレームワーク境界のバイパスである。
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: () => undefined,
      getAll: () => [],
      has: () => false,
    }),
  headers: () => Promise.resolve(new Headers()),
}));

// 統合テストは Next.js のインクリメンタルキャッシュ機構を持たないため、
// unstable_cache をキャッシュなしで直接実行するスタブに置き換える。
vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T) =>
    (...args: Parameters<T>) =>
      fn(...args),
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}));
