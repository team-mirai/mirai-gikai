import { describe, expect, it } from "vitest";
import { getClientIp } from "./client-ip";

describe("getClientIp", () => {
  it("x-forwarded-for の先頭IPを返す", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.1, 198.51.100.2",
    });
    expect(getClientIp(headers)).toBe("203.0.113.1");
  });

  it("x-forwarded-for がなければ x-real-ip を返す", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.9" });
    expect(getClientIp(headers)).toBe("203.0.113.9");
  });

  it("どちらもなければ null", () => {
    expect(getClientIp(new Headers())).toBeNull();
  });

  it("空の x-forwarded-for は無視して null", () => {
    const headers = new Headers({ "x-forwarded-for": " " });
    expect(getClientIp(headers)).toBeNull();
  });
});
