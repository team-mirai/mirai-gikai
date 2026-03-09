import { describe, expect, it } from "vitest";
import {
  expertRegistrationSchema,
  isExpertRegistrationTargetRole,
} from "./expert-registration-validation";

describe("expertRegistrationSchema", () => {
  const validData = {
    name: "山田太郎",
    affiliation: "○○大学 教授",
    email: "yamada@example.com",
    privacyAgreed: true as const,
  };

  it("有効なデータはバリデーションを通過する", () => {
    const result = expertRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("名前が空の場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("お名前を入力してください");
    }
  });

  it("名前が100文字を超える場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      name: "あ".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "お名前は100文字以内で入力してください"
      );
    }
  });

  it("所属が空の場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      affiliation: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "ご所属・肩書を入力してください"
      );
    }
  });

  it("所属が200文字を超える場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      affiliation: "あ".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "ご所属・肩書は200文字以内で入力してください"
      );
    }
  });

  it("メールアドレスが空の場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      email: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "メールアドレスを入力してください"
      );
    }
  });

  it("不正なメールアドレスの場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "正しいメールアドレスを入力してください"
      );
    }
  });

  it("プライバシーポリシー未同意の場合はエラー", () => {
    const result = expertRegistrationSchema.safeParse({
      ...validData,
      privacyAgreed: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "プライバシーポリシーへの同意が必要です"
      );
    }
  });
});

describe("isExpertRegistrationTargetRole", () => {
  it("subject_expertは対象ロール", () => {
    expect(isExpertRegistrationTargetRole("subject_expert")).toBe(true);
  });

  it("work_relatedは対象ロール", () => {
    expect(isExpertRegistrationTargetRole("work_related")).toBe(true);
  });

  it("daily_life_affectedは対象外", () => {
    expect(isExpertRegistrationTargetRole("daily_life_affected")).toBe(false);
  });

  it("general_citizenは対象外", () => {
    expect(isExpertRegistrationTargetRole("general_citizen")).toBe(false);
  });

  it("nullは対象外", () => {
    expect(isExpertRegistrationTargetRole(null)).toBe(false);
  });

  it("undefinedは対象外", () => {
    expect(isExpertRegistrationTargetRole(undefined)).toBe(false);
  });
});
