// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rubyfulClient } from "./index";

describe("RubyfulClient", () => {
  let elements: HTMLElement[];

  beforeEach(() => {
    rubyfulClient.hide();
    localStorage.clear();

    elements = [];
    for (let i = 0; i < 3; i++) {
      const el = document.createElement("rt");
      el.className = "rubyful-rt hidden";
      document.body.appendChild(el);
      elements.push(el);
    }
  });

  afterEach(() => {
    for (const el of elements) {
      el.remove();
    }
  });

  describe("show", () => {
    it("getIsEnabled()がtrueを返す", () => {
      rubyfulClient.show();
      expect(rubyfulClient.getIsEnabled()).toBe(true);
    });

    it('localStorageに"true"が保存される', () => {
      rubyfulClient.show();
      expect(localStorage.getItem("rubyful-enabled")).toBe("true");
    });

    it('.rubyful-rt要素から"hidden"クラスが除去される', () => {
      rubyfulClient.show();
      for (const el of elements) {
        expect(el.classList.contains("hidden")).toBe(false);
      }
    });
  });

  describe("hide", () => {
    it("getIsEnabled()がfalseを返す", () => {
      rubyfulClient.show();
      rubyfulClient.hide();
      expect(rubyfulClient.getIsEnabled()).toBe(false);
    });

    it('localStorageに"false"が保存される', () => {
      rubyfulClient.show();
      rubyfulClient.hide();
      expect(localStorage.getItem("rubyful-enabled")).toBe("false");
    });

    it('.rubyful-rt要素に"hidden"クラスが追加される', () => {
      rubyfulClient.show();
      rubyfulClient.hide();
      for (const el of elements) {
        expect(el.classList.contains("hidden")).toBe(true);
      }
    });
  });

  describe("toggle", () => {
    it("初期状態(false)からtoggle()でtrueになる", () => {
      rubyfulClient.toggle();
      expect(rubyfulClient.getIsEnabled()).toBe(true);
    });

    it("true状態からtoggle()でfalseになる", () => {
      rubyfulClient.show();
      rubyfulClient.toggle();
      expect(rubyfulClient.getIsEnabled()).toBe(false);
    });
  });

  describe("getIsEnabled", () => {
    it("現在の状態を返す", () => {
      expect(rubyfulClient.getIsEnabled()).toBe(false);
      rubyfulClient.show();
      expect(rubyfulClient.getIsEnabled()).toBe(true);
      rubyfulClient.hide();
      expect(rubyfulClient.getIsEnabled()).toBe(false);
    });
  });

  describe("getIsEnabledFromStorage", () => {
    it("localStorageの値を返す", () => {
      expect(rubyfulClient.getIsEnabledFromStorage()).toBe(false);
      localStorage.setItem("rubyful-enabled", "true");
      expect(rubyfulClient.getIsEnabledFromStorage()).toBe(true);
    });
  });
});
