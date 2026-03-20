import { describe, expect, it } from "vitest";
import { parseOpinions } from "./parse-opinions";

describe("parseOpinions", () => {
  it("should parse a valid opinions array", () => {
    const input = [
      { title: "意見1", content: "内容1" },
      { title: "意見2", content: "内容2" },
    ];
    expect(parseOpinions(input)).toEqual(input);
  });

  it("should return empty array for null", () => {
    expect(parseOpinions(null)).toEqual([]);
  });

  it("should return empty array for undefined", () => {
    expect(parseOpinions(undefined)).toEqual([]);
  });

  it("should return empty array for non-array values", () => {
    expect(parseOpinions("string")).toEqual([]);
    expect(parseOpinions(123)).toEqual([]);
    expect(parseOpinions({})).toEqual([]);
  });

  it("should return empty array for empty array", () => {
    expect(parseOpinions([])).toEqual([]);
  });

  it("should filter out invalid entries from array", () => {
    const input = [
      { title: "有効", content: "OK" },
      "not an object",
      { title: 123, content: "missing title type" },
      null,
      { title: "no content" },
      { title: "有効2", content: "OK2" },
    ];
    expect(parseOpinions(input)).toEqual([
      { title: "有効", content: "OK" },
      { title: "有効2", content: "OK2" },
    ]);
  });
});
