import { describe, expect, it } from "vitest";
import { parseAssignmentTsv } from "./parse-assignment-tsv";

const valid = new Set(["t0", "t1", "t2"]);

describe("parseAssignmentTsv", () => {
  it("タブ区切りをパースする", () => {
    const r = parseAssignmentTsv("1\tt0\n2\tnull\n3\tt2", 3, valid);
    expect(r.get(1)).toBe("t0");
    expect(r.get(2)).toBeNull();
    expect(r.get(3)).toBe("t2");
  });

  it("タブ以外の区切り（空白・コロン・矢印・ハイフン）も許容する", () => {
    const r = parseAssignmentTsv("1 t0\n2:t1\n3 → t2", 3, valid);
    expect(r.get(1)).toBe("t0");
    expect(r.get(2)).toBe("t1");
    expect(r.get(3)).toBe("t2");
  });

  it("未出現の意見番号は null に倒す", () => {
    const r = parseAssignmentTsv("1\tt0", 3, valid);
    expect(r.get(2)).toBeNull();
    expect(r.get(3)).toBeNull();
  });

  it("範囲外の番号は無視する", () => {
    const r = parseAssignmentTsv("1\tt0\n9\tt1", 3, valid);
    expect(r.has(9)).toBe(false);
    expect(r.get(1)).toBe("t0");
  });

  it("存在しないトピックIDは null に倒す", () => {
    const r = parseAssignmentTsv("1\tt9\n2\tgarbage", 3, valid);
    expect(r.get(1)).toBeNull();
    expect(r.get(2)).toBeNull();
  });

  it("空行・余分な空白を無視する", () => {
    const r = parseAssignmentTsv("\n  1\tt0  \n\n 2\tt1 \n", 3, valid);
    expect(r.get(1)).toBe("t0");
    expect(r.get(2)).toBe("t1");
  });

  it("全件 null（空入力）でも batchSize 分のエントリを返す", () => {
    const r = parseAssignmentTsv("", 2, valid);
    expect(r.size).toBe(2);
    expect(r.get(1)).toBeNull();
    expect(r.get(2)).toBeNull();
  });

  it("バッククォート・引用符・末尾カンマを除去して照合する", () => {
    const r = parseAssignmentTsv("1\t`t0`\n2\t\"t1\"\n3\tt2,", 3, valid);
    expect(r.get(1)).toBe("t0");
    expect(r.get(2)).toBe("t1");
    expect(r.get(3)).toBe("t2");
  });
});
