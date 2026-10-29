import { describe, expect, it } from "vitest";
import { fetchAllPages } from "./fetch-all-pages";

function createSource(total: number) {
  const rows = Array.from({ length: total }, (_, i) => i);
  const calls: Array<[number, number]> = [];
  const fetchPage = async (from: number, to: number) => {
    calls.push([from, to]);
    return rows.slice(from, to + 1);
  };
  return { rows, calls, fetchPage };
}

describe("fetchAllPages", () => {
  it("ページサイズ未満なら1回の取得で終わる", async () => {
    const { rows, calls, fetchPage } = createSource(3);

    const result = await fetchAllPages(fetchPage, 5);

    expect(result).toEqual(rows);
    expect(calls).toEqual([[0, 4]]);
  });

  it("ページサイズを超える行を順番どおりすべて連結する", async () => {
    const { rows, calls, fetchPage } = createSource(12);

    const result = await fetchAllPages(fetchPage, 5);

    expect(result).toEqual(rows);
    expect(calls).toEqual([
      [0, 4],
      [5, 9],
      [10, 14],
    ]);
  });

  it("行数がページサイズの倍数なら空ページを確認して終わる", async () => {
    const { rows, calls, fetchPage } = createSource(10);

    const result = await fetchAllPages(fetchPage, 5);

    expect(result).toEqual(rows);
    expect(calls).toEqual([
      [0, 4],
      [5, 9],
      [10, 14],
    ]);
  });

  it("ページサイズ省略時は Supabase の max_rows（1000）単位で取得する", async () => {
    const { rows, calls, fetchPage } = createSource(1001);

    const result = await fetchAllPages(fetchPage);

    expect(result).toEqual(rows);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });
});
