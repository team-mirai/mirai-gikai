import { describe, expect, it } from "vitest";

import { formatRoleLabel, roleLabels } from "./constants";

describe("formatRoleLabel", () => {
  it("returns label for known role without roleTitle", () => {
    expect(formatRoleLabel("subject_expert")).toBe("専門的な有識者");
    expect(formatRoleLabel("work_related")).toBe("業務に関係");
    expect(formatRoleLabel("daily_life_affected")).toBe("暮らしに影響");
    expect(formatRoleLabel("general_citizen")).toBe("一市民として関心");
  });

  it("returns role string as-is when role is not in roleLabels", () => {
    expect(formatRoleLabel("unknown_role")).toBe("unknown_role");
  });

  it("returns combined label with nakaguro when both role and roleTitle are provided", () => {
    expect(formatRoleLabel("subject_expert", "物流業者")).toBe(
      "専門的な有識者・物流業者"
    );
  });

  it("returns combined label for unknown role with roleTitle", () => {
    expect(formatRoleLabel("custom_role", "カスタム")).toBe(
      "custom_role・カスタム"
    );
  });

  it("returns roleTitle when role is null and roleTitle is provided", () => {
    expect(formatRoleLabel(null, "フリーランス")).toBe("フリーランス");
  });

  it("returns roleTitle when role is undefined and roleTitle is provided", () => {
    expect(formatRoleLabel(undefined, "フリーランス")).toBe("フリーランス");
  });

  it("returns null when both role and roleTitle are null", () => {
    expect(formatRoleLabel(null, null)).toBeNull();
  });

  it("returns null when both role and roleTitle are undefined", () => {
    expect(formatRoleLabel(undefined, undefined)).toBeNull();
  });

  it("returns null when called with no arguments", () => {
    expect(formatRoleLabel()).toBeNull();
  });

  it("returns label when role is provided and roleTitle is null", () => {
    expect(formatRoleLabel("work_related", null)).toBe("業務に関係");
  });

  it("covers all keys in roleLabels", () => {
    for (const [role, label] of Object.entries(roleLabels)) {
      expect(formatRoleLabel(role)).toBe(label);
    }
  });
});
