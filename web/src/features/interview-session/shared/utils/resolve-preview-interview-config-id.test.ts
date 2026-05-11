import { describe, expect, it, vi } from "vitest";
import { resolvePreviewInterviewConfigId } from "./resolve-preview-interview-config-id";

describe("resolvePreviewInterviewConfigId", () => {
  it("interviewConfigId が無ければ validate を呼ばず ok(undefined) を返す", async () => {
    const validate = vi.fn();
    const result = await resolvePreviewInterviewConfigId(
      { billId: "bill-1" },
      validate
    );

    expect(result).toEqual({ ok: true, interviewConfigId: undefined });
    expect(validate).not.toHaveBeenCalled();
  });

  it("interviewConfigId 指定時に有効な previewToken が渡ればその configId を返す", async () => {
    const validate = vi.fn().mockResolvedValue(true);
    const result = await resolvePreviewInterviewConfigId(
      {
        billId: "bill-1",
        interviewConfigId: "config-1",
        previewToken: "valid-token",
      },
      validate
    );

    expect(result).toEqual({ ok: true, interviewConfigId: "config-1" });
    expect(validate).toHaveBeenCalledWith("bill-1", "valid-token");
  });

  it("interviewConfigId 指定時に previewToken が未指定なら invalid_preview_token を返す", async () => {
    const validate = vi.fn().mockResolvedValue(false);
    const result = await resolvePreviewInterviewConfigId(
      { billId: "bill-1", interviewConfigId: "config-1" },
      validate
    );

    expect(result).toEqual({ ok: false, reason: "invalid_preview_token" });
    expect(validate).toHaveBeenCalledWith("bill-1", undefined);
  });

  it("interviewConfigId 指定時に previewToken が無効なら invalid_preview_token を返す", async () => {
    const validate = vi.fn().mockResolvedValue(false);
    const result = await resolvePreviewInterviewConfigId(
      {
        billId: "bill-1",
        interviewConfigId: "config-1",
        previewToken: "expired-token",
      },
      validate
    );

    expect(result).toEqual({ ok: false, reason: "invalid_preview_token" });
  });
});
