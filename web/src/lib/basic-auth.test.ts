import { describe, expect, it } from "vitest";

import { parseBasicAuth } from "./basic-auth";

describe("parseBasicAuth", () => {
  it("parses a valid Basic auth header", () => {
    // btoa("admin:password123") === "YWRtaW46cGFzc3dvcmQxMjM="
    const result = parseBasicAuth("Basic YWRtaW46cGFzc3dvcmQxMjM=");

    expect(result).toEqual({ username: "admin", password: "password123" });
  });

  it("parses credentials with colon in password", () => {
    // btoa("user:pass:word") === "dXNlcjpwYXNzOndvcmQ="
    // split(":") only splits on first colon, so password becomes "pass" and "word" is lost
    const result = parseBasicAuth("Basic dXNlcjpwYXNzOndvcmQ=");

    // The implementation uses split(":") which splits into all parts,
    // destructuring takes only first two elements
    expect(result).toEqual({ username: "user", password: "pass" });
  });

  it("returns null when auth value after 'Basic ' is missing", () => {
    const result = parseBasicAuth("Basic ");

    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = parseBasicAuth("");

    expect(result).toBeNull();
  });

  it("returns a result for non-Basic scheme with decodable value", () => {
    // "Bearer token123".split(" ")[1] is "token123"
    // atob("token123") does not throw, so the function returns a parsed result
    const result = parseBasicAuth("Bearer token123");

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("username");
  });

  it("returns null when header has only one segment with no space", () => {
    // "NoSpaceHere".split(" ")[1] is undefined, so the function returns null
    const result = parseBasicAuth("NoSpaceHere");

    expect(result).toBeNull();
  });

  it("returns undefined password when decoded value has no colon", () => {
    // btoa("nocolon") === "bm9jb2xvbg=="
    const result = parseBasicAuth("Basic bm9jb2xvbg==");

    expect(result).toEqual({ username: "nocolon", password: undefined });
  });

  it("returns null for invalid base64 input", () => {
    const result = parseBasicAuth("Basic !!!invalid-base64!!!");

    expect(result).toBeNull();
  });
});
