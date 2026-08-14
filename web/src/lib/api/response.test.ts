import { describe, expect, it } from "vitest";
import { jsonNoStore, jsonResponse, textResponse } from "./response";

describe("jsonNoStore", () => {
  it("Cache-Control: no-store 付きのJSONレスポンスを返す", async () => {
    const res = jsonNoStore({ items: [] });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ items: [] });
  });

  it("ステータスコードと追加ヘッダを指定できる", () => {
    const res = jsonNoStore({ error: "too many" }, 429, {
      "Retry-After": "30",
    });

    expect(res.status).toBe(429);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Retry-After")).toBe("30");
  });
});

describe("textResponse", () => {
  it("指定されたメッセージとステータスコードでレスポンスを返す", async () => {
    const res = textResponse("エラーです", 429);

    expect(res.status).toBe(429);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe("エラーです");
  });
});

describe("jsonResponse", () => {
  it("JSONシリアライズされたボディとステータスコードでレスポンスを返す", async () => {
    const res = jsonResponse({ error: "not found" }, 404);

    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ error: "not found" });
  });
});
