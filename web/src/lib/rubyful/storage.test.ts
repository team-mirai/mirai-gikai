// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getRubyEnabledFromStorage, setRubyEnabledToStorage } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getRubyEnabledFromStorage", () => {
    it("localStorage未設定の場合falseを返す", () => {
      expect(getRubyEnabledFromStorage()).toBe(false);
    });

    it('localStorage="true"の場合trueを返す', () => {
      localStorage.setItem("rubyful-enabled", "true");
      expect(getRubyEnabledFromStorage()).toBe(true);
    });

    it('localStorage="false"の場合falseを返す', () => {
      localStorage.setItem("rubyful-enabled", "false");
      expect(getRubyEnabledFromStorage()).toBe(false);
    });

    it('localStorage="other"の場合falseを返す', () => {
      localStorage.setItem("rubyful-enabled", "other");
      expect(getRubyEnabledFromStorage()).toBe(false);
    });
  });

  describe("setRubyEnabledToStorage", () => {
    it('enabled=trueでlocalStorageに"true"を保存する', () => {
      setRubyEnabledToStorage(true);
      expect(localStorage.getItem("rubyful-enabled")).toBe("true");
    });

    it('enabled=falseでlocalStorageに"false"を保存する', () => {
      setRubyEnabledToStorage(false);
      expect(localStorage.getItem("rubyful-enabled")).toBe("false");
    });
  });
});
