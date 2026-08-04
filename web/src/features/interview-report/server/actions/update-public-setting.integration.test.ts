import { describe, expect, it } from "vitest";
import { updatePublicSetting } from "./update-public-setting";

describe("updatePublicSetting", () => {
  it("未認証の場合は success: false を返す", async () => {
    const result = await updatePublicSetting(
      "00000000-0000-0000-0000-000000000000",
      true,
      true
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
