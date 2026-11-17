import { describe, expect, it } from "vitest";
import { supplementaryResolutionInputSchema } from ".";

function parse(referenceUrl: unknown) {
  return supplementaryResolutionInputSchema.safeParse({
    house: "HR",
    stance: "for",
    referenceUrl,
  });
}

describe("supplementaryResolutionInputSchema の参考リンク", () => {
  it("省略・null・空文字は未設定として受け付ける", () => {
    expect(
      supplementaryResolutionInputSchema.safeParse({
        house: "HR",
        stance: "for",
      }).success
    ).toBe(true);
    expect(parse(null).success).toBe(true);
    expect(parse("").success).toBe(true);
    expect(parse("   ").success).toBe(true);
  });

  it("http(s) の URL は前後の空白を除いて受け付ける", () => {
    const result = parse(" https://example.com/resolution ");
    expect(result.success && result.data.referenceUrl).toBe(
      "https://example.com/resolution"
    );
  });

  it("http(s) 以外は受け付けない", () => {
    const result = parse("javascript:alert(1)");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "有効なURLを入力してください"
    );
  });
});
