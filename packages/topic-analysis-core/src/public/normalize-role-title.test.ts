import { describe, expect, it } from "vitest";
import { normalizeRoleTitle } from "./normalize-role-title";

describe("normalizeRoleTitle", () => {
  it("固有の肩書はそのまま返す", () => {
    expect(normalizeRoleTitle("育休経験者")).toBe("育休経験者");
  });
  it("前後の空白はトリムする", () => {
    expect(normalizeRoleTitle("  育休経験者  ")).toBe("育休経験者");
  });
  it("null・空白は null", () => {
    expect(normalizeRoleTitle(null)).toBeNull();
    expect(normalizeRoleTitle("  ")).toBeNull();
  });
  it("汎用的な「市民」相当（一般市民/市民/一般）は null", () => {
    expect(normalizeRoleTitle("一般市民")).toBeNull();
    expect(normalizeRoleTitle("市民")).toBeNull();
    expect(normalizeRoleTitle("一般")).toBeNull();
  });
});
