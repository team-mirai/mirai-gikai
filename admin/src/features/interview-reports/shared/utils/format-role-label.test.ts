import { describe, expect, it } from "vitest";
import { formatRoleLabel } from "./format-role-label";

const roleLabels: Record<string, string> = {
  subject_expert: "専門的な有識者",
  work_related: "業務に関係",
  daily_life_affected: "暮らしに影響",
  general_citizen: "一市民として関心",
};

describe("formatRoleLabel", () => {
  it("roleとroleTitleの両方がある場合は中黒で結合する", () => {
    expect(formatRoleLabel("subject_expert", "物流業者", roleLabels)).toBe(
      "専門的な有識者・物流業者"
    );
  });

  it("roleのみの場合はラベルを返す", () => {
    expect(formatRoleLabel("work_related", null, roleLabels)).toBe(
      "業務に関係"
    );
  });

  it("roleTitleのみの場合はroleTitleを返す", () => {
    expect(formatRoleLabel(null, "市民代表", roleLabels)).toBe("市民代表");
  });

  it("両方nullの場合はnullを返す", () => {
    expect(formatRoleLabel(null, null, roleLabels)).toBeNull();
  });

  it("未知のroleの場合はそのまま使用する", () => {
    expect(formatRoleLabel("unknown_role", "テスト", roleLabels)).toBe(
      "unknown_role・テスト"
    );
  });

  it("roleがundefinedの場合", () => {
    expect(formatRoleLabel(undefined, "テスト", roleLabels)).toBe("テスト");
  });

  it("roleTitleがundefinedの場合", () => {
    expect(formatRoleLabel("general_citizen", undefined, roleLabels)).toBe(
      "一市民として関心"
    );
  });
});
