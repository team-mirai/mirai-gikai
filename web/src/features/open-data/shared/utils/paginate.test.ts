import { describe, expect, it } from "vitest";
import { decodeCursor } from "./cursor";
import { paginateRows } from "./paginate";

type Row = { createdAt: string; id: string };

const toCursor = (row: Row) => ({ createdAt: row.createdAt, id: row.id });

const row = (n: number): Row => ({
  createdAt: `2026-01-0${n}T00:00:00+00:00`,
  id: `123e4567-e89b-12d3-a456-42661417400${n}`,
});

describe("paginateRows", () => {
  it("limitを超える行がある場合はlimit件に切り詰め、最終行のカーソルを返す", () => {
    const result = paginateRows([row(3), row(2), row(1)], 2, toCursor);
    expect(result.pageRows).toEqual([row(3), row(2)]);
    expect(result.nextCursor).not.toBeNull();
    expect(decodeCursor(result.nextCursor ?? "")).toEqual(toCursor(row(2)));
  });

  it("limit以下の場合は全行を返し、nextCursorはnull", () => {
    const result = paginateRows([row(1)], 2, toCursor);
    expect(result.pageRows).toEqual([row(1)]);
    expect(result.nextCursor).toBeNull();
  });

  it("空の場合は空配列とnullを返す", () => {
    const result = paginateRows([], 2, toCursor);
    expect(result.pageRows).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
});
