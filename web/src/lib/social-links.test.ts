import { describe, expect, it } from "vitest";

import { SOCIAL_LINKS, getSocialLinksArray } from "./social-links";

describe("getSocialLinksArray", () => {
  it("returns an array", () => {
    const result = getSocialLinksArray();

    expect(Array.isArray(result)).toBe(true);
  });

  it("has the same number of elements as SOCIAL_LINKS keys", () => {
    const result = getSocialLinksArray();

    expect(result).toHaveLength(Object.keys(SOCIAL_LINKS).length);
  });

  it("each element has a key property matching a SOCIAL_LINKS key", () => {
    const result = getSocialLinksArray();
    const keys = Object.keys(SOCIAL_LINKS);

    for (const item of result) {
      expect(keys).toContain(item.key);
    }
  });

  it("each element has required SocialLink properties", () => {
    const result = getSocialLinksArray();

    for (const item of result) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("iconPath");
      expect(item).toHaveProperty("hasBorder");
      expect(typeof item.name).toBe("string");
      expect(typeof item.url).toBe("string");
      expect(typeof item.iconPath).toBe("string");
      expect(typeof item.hasBorder).toBe("boolean");
    }
  });

  it("preserves the original link data with key added", () => {
    const result = getSocialLinksArray();

    for (const item of result) {
      const original = SOCIAL_LINKS[item.key];
      expect(item.name).toBe(original.name);
      expect(item.url).toBe(original.url);
      expect(item.iconPath).toBe(original.iconPath);
      expect(item.hasBorder).toBe(original.hasBorder);
    }
  });
});
