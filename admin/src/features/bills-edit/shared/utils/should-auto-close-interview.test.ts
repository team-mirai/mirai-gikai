import { describe, expect, it } from "vitest";
import { shouldAutoCloseInterviewOnBillStatus } from "./should-auto-close-interview";

describe("shouldAutoCloseInterviewOnBillStatus", () => {
  it("enacted のときは true を返す", () => {
    expect(shouldAutoCloseInterviewOnBillStatus("enacted")).toBe(true);
  });

  it.each([
    ["preparing"],
    ["introduced"],
    ["in_originating_house"],
    ["in_receiving_house"],
    ["rejected"],
  ] as const)("%s のときは false を返す", (status) => {
    expect(shouldAutoCloseInterviewOnBillStatus(status)).toBe(false);
  });
});
