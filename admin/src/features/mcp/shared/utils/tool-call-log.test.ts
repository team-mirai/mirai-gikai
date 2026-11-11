import { describe, expect, it } from "vitest";
import {
  summarizeToolArgs,
  summarizeToolResult,
  truncateForLog,
} from "./tool-call-log";

describe("truncateForLog", () => {
  it("上限以下ならそのまま返す", () => {
    expect(truncateForLog("abc", 3)).toBe("abc");
  });

  it("上限を超えたら切り詰めて元の文字数を添える", () => {
    expect(truncateForLog("abcdef", 3)).toBe("abc…(6 chars)");
  });
});

describe("summarizeToolArgs", () => {
  it("引数を JSON にする", () => {
    expect(summarizeToolArgs({ since: "2026-11-10T00:00:00+09:00" })).toBe(
      '{"since":"2026-11-10T00:00:00+09:00"}'
    );
  });

  it("引数が無いツールは - を返す", () => {
    expect(summarizeToolArgs(undefined)).toBe("-");
  });

  it("ID・日時・列挙値以外の文字列は文字数だけにする", () => {
    expect(
      summarizeToolArgs({
        billId: "778423f0-7190-4f63-adf0-52a5c25402b5",
        type: "for",
        comment: "判断の理由を書いた文章",
        reachedStep: 1,
      })
    ).toBe(
      '{"billId":"778423f0-7190-4f63-adf0-52a5c25402b5","type":"for","comment":"<11 chars>","reachedStep":1}'
    );
  });

  it("長い引数は切り詰める", () => {
    const summary = summarizeToolArgs({
      ids: Array.from({ length: 100 }, (_, i) => `id-${i}`),
    });
    expect(summary.length).toBeLessThan(600);
    expect(summary).toMatch(/…\(\d+ chars\)$/);
  });
});

describe("summarizeToolResult", () => {
  it("成功したら本文を出さず、種類と大きさだけを出す", () => {
    expect(
      summarizeToolResult({
        content: [
          { type: "text", text: '{"bills":[]}' },
          { type: "image", data: "aGVsbG8=", mimeType: "image/png" },
        ],
      })
    ).toBe("ok content=[text(12 chars), image(image/png, 8 base64 chars)]");
  });

  it("エラーのときは理由のテキストも出す", () => {
    expect(
      summarizeToolResult({
        isError: true,
        content: [{ type: "text", text: "法案が見つかりません" }],
      })
    ).toBe("error content=[text(10 chars)] message=法案が見つかりません");
  });
});
