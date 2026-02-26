import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getSpeechSpeed, setSpeechSpeed } from "./speech-speed-storage";

const store = new Map<string, string>();

const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    store.delete(key);
  }),
  clear: vi.fn(() => {
    store.clear();
  }),
};

describe("speech-speed-storage", () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("未設定時は 'normal' を返す", () => {
    expect(getSpeechSpeed()).toBe("normal");
  });

  it("有効値を保存・復元できる", () => {
    setSpeechSpeed("slow");
    expect(getSpeechSpeed()).toBe("slow");

    setSpeechSpeed("fast");
    expect(getSpeechSpeed()).toBe("fast");

    setSpeechSpeed("normal");
    expect(getSpeechSpeed()).toBe("normal");
  });

  it("無効値が保存されている場合は 'normal' にフォールバックする", () => {
    store.set("voice-interview-speed", "invalid-value");
    expect(getSpeechSpeed()).toBe("normal");
  });
});
