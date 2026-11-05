import { describe, expect, it } from "vitest";
import {
  assertSeedTargetAllowed,
  getSeedTargetRejection,
  isLocalSupabaseUrl,
  isSeedAllowRemote,
} from "./seed-target";

describe("isLocalSupabaseUrl", () => {
  it.each([
    "http://localhost:54321",
    "http://LOCALHOST:54321",
    "http://127.0.0.1:54321",
    "http://127.0.0.1:54421",
    "http://[::1]:54321",
  ])("ローカルの URL %s を true と判定する", (url) => {
    expect(isLocalSupabaseUrl(url)).toBe(true);
  });

  it.each([
    "https://abcdefghijkl.supabase.co",
    "http://127.0.0.1.example.com:54321",
    "http://localhost.example.com",
    "http://192.168.1.10:54321",
  ])("リモートの URL %s を false と判定する", (url) => {
    expect(isLocalSupabaseUrl(url)).toBe(false);
  });

  it("未設定・空文字・不正な URL は false と判定する", () => {
    expect(isLocalSupabaseUrl(undefined)).toBe(false);
    expect(isLocalSupabaseUrl("")).toBe(false);
    expect(isLocalSupabaseUrl("not a url")).toBe(false);
  });
});

describe("isSeedAllowRemote", () => {
  it('"1" と "true"（大文字小文字・前後空白を無視）のみ true と判定する', () => {
    expect(isSeedAllowRemote("1")).toBe(true);
    expect(isSeedAllowRemote("true")).toBe(true);
    expect(isSeedAllowRemote(" TRUE ")).toBe(true);
  });

  it("それ以外の値は false と判定する", () => {
    expect(isSeedAllowRemote(undefined)).toBe(false);
    expect(isSeedAllowRemote("")).toBe(false);
    expect(isSeedAllowRemote("0")).toBe(false);
    expect(isSeedAllowRemote("false")).toBe(false);
    expect(isSeedAllowRemote("yes")).toBe(false);
  });
});

describe("getSeedTargetRejection", () => {
  it("ローカル接続ならオプトインが無くても許可する", () => {
    expect(
      getSeedTargetRejection({
        supabaseUrl: "http://127.0.0.1:54321",
        allowRemote: undefined,
      })
    ).toBeNull();
  });

  it("リモート接続はオプトインが無ければ拒否し、理由に URL と環境変数名を含める", () => {
    const rejection = getSeedTargetRejection({
      supabaseUrl: "https://abcdefghijkl.supabase.co",
      allowRemote: undefined,
    });
    expect(rejection).toContain("https://abcdefghijkl.supabase.co");
    expect(rejection).toContain("SEED_ALLOW_REMOTE=1");
  });

  it("SUPABASE_URL 未設定も拒否する", () => {
    expect(
      getSeedTargetRejection({ supabaseUrl: undefined, allowRemote: undefined })
    ).toContain("unset");
  });

  it("リモート接続でも SEED_ALLOW_REMOTE=1 なら許可する", () => {
    expect(
      getSeedTargetRejection({
        supabaseUrl: "https://abcdefghijkl.supabase.co",
        allowRemote: "1",
      })
    ).toBeNull();
  });
});

describe("assertSeedTargetAllowed", () => {
  it("拒否される場合は理由を持つ Error を投げる", () => {
    expect(() =>
      assertSeedTargetAllowed({
        supabaseUrl: "https://abcdefghijkl.supabase.co",
        allowRemote: undefined,
      })
    ).toThrow(/Refusing to seed/);
  });

  it("許可される場合は何もしない", () => {
    expect(() =>
      assertSeedTargetAllowed({
        supabaseUrl: "http://localhost:54321",
        allowRemote: undefined,
      })
    ).not.toThrow();
  });
});
