import { describe, expect, it } from "vitest";
import { GET } from "./route";

function buildRequest(query = ""): Request {
  // レートリミットの干渉を避けるためテスト専用IPを使う
  return new Request(`http://localhost:3000/api/open-data/bills${query}`, {
    headers: { "x-forwarded-for": "198.51.100.1" },
  });
}

describe("GET /api/open-data/bills", () => {
  it("limit が不正な場合は400を返す", async () => {
    const res = await GET(buildRequest("?limit=0"));
    expect(res.status).toBe(400);
  });

  it("difficulty が不正な場合は400を返す", async () => {
    const res = await GET(buildRequest("?difficulty=expert"));
    expect(res.status).toBe(400);
  });

  it("cursor が不正な場合は400を返す", async () => {
    const res = await GET(buildRequest("?cursor=invalid!!"));
    expect(res.status).toBe(400);
  });

  it("一覧をno-storeで返す", async () => {
    const res = await GET(buildRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect("nextCursor" in body).toBe(true);
  });
});
