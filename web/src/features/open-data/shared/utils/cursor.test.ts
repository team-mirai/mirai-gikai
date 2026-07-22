import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

const cursor = {
  createdAt: "2026-07-14T12:00:00.000Z",
  id: "123e4567-e89b-42d3-a456-426614174000",
};

describe("encodeCursor / decodeCursor", () => {
  it("エンコードしたカーソルをデコードすると元に戻る", () => {
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("base64urlでない文字列は null", () => {
    expect(decodeCursor("!!!not-base64!!!")).toBeNull();
  });

  it("区切りのない文字列は null", () => {
    const encoded = Buffer.from("no-separator", "utf8").toString("base64url");
    expect(decodeCursor(encoded)).toBeNull();
  });

  it("日時が不正な場合は null", () => {
    const encoded = Buffer.from(`not-a-date|${cursor.id}`, "utf8").toString(
      "base64url"
    );
    expect(decodeCursor(encoded)).toBeNull();
  });

  it("ISO形式だが実在しない日付（2/30等）は null", () => {
    // Date.parse は 3/2 に正規化して受理するが、Postgres 側でエラーになるため弾く
    const encoded = Buffer.from(
      `2026-02-30T00:00:00.000Z|${cursor.id}`,
      "utf8"
    ).toString("base64url");
    expect(decodeCursor(encoded)).toBeNull();
  });

  it("ISO形式でない日付表現（英語表記等）は null", () => {
    const encoded = Buffer.from(
      `March 5 2026 00:00:00 GMT|${cursor.id}`,
      "utf8"
    ).toString("base64url");
    expect(decodeCursor(encoded)).toBeNull();
  });

  it("DBが返す +00:00 オフセット・マイクロ秒形式も受理する", () => {
    const dbFormat = "2026-07-14T12:00:00.123456+00:00";
    const encoded = Buffer.from(`${dbFormat}|${cursor.id}`, "utf8").toString(
      "base64url"
    );
    expect(decodeCursor(encoded)).toEqual({
      createdAt: dbFormat,
      id: cursor.id,
    });
  });

  it("IDがUUIDでない場合は null", () => {
    const encoded = Buffer.from(
      `${cursor.createdAt}|not-a-uuid`,
      "utf8"
    ).toString("base64url");
    expect(decodeCursor(encoded)).toBeNull();
  });
});
