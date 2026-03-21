import { describe, it, expect } from "vitest";
import { textResponse, jsonResponse } from "./response";

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
