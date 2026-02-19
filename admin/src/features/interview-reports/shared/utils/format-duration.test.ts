import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("completedAtがnullの場合は'-'を返す", () => {
    expect(formatDuration("2024-01-01T10:00:00Z", null)).toBe("-");
  });

  it("分のみの場合は「X分」を返す", () => {
    expect(formatDuration("2024-01-01T10:00:00Z", "2024-01-01T10:30:00Z")).toBe(
      "30分"
    );
  });

  it("1時間ちょうどの場合は「1時間0分」を返す", () => {
    expect(formatDuration("2024-01-01T10:00:00Z", "2024-01-01T11:00:00Z")).toBe(
      "1時間0分"
    );
  });

  it("時間と分がある場合は「X時間Y分」を返す", () => {
    expect(formatDuration("2024-01-01T10:00:00Z", "2024-01-01T11:30:00Z")).toBe(
      "1時間30分"
    );
  });

  it("0分の場合は「0分」を返す", () => {
    expect(formatDuration("2024-01-01T10:00:00Z", "2024-01-01T10:00:00Z")).toBe(
      "0分"
    );
  });

  it("複数時間の場合", () => {
    expect(formatDuration("2024-01-01T10:00:00Z", "2024-01-01T12:45:00Z")).toBe(
      "2時間45分"
    );
  });
});
