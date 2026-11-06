import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_CACHE_TAGS, CACHE_TAGS } from "@/lib/cache-tags";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

// revalidateTag は Next.js のリクエストコンテキスト外では例外を投げるため差し替える
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
}));

vi.mock("@/lib/env", () => ({
  env: { revalidateSecret: "test-secret" },
}));

function createRequest(options: { authorization?: string; body?: unknown }) {
  const headers = new Headers();
  if (options.authorization) {
    headers.set("authorization", options.authorization);
  }
  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

describe("POST /api/revalidate", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("シークレットが一致しなければ 401 を返し revalidate しない", async () => {
    const response = await POST(
      createRequest({ authorization: "Bearer wrong-secret" })
    );

    expect(response.status).toBe(401);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("指定されたタグのうち既知のものだけを即時失効させる", async () => {
    const response = await POST(
      createRequest({
        authorization: "Bearer test-secret",
        body: { tags: [CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS, "unknown-tag"] },
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.tags).toEqual([CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS]);
    expect(mocks.revalidateTag).toHaveBeenCalledTimes(1);
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS,
      { expire: 0 }
    );
  });

  it("タグ未指定なら全タグを即時失効させる", async () => {
    const response = await POST(
      createRequest({ authorization: "Bearer test-secret" })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.tags).toEqual(ALL_CACHE_TAGS);
    for (const tag of ALL_CACHE_TAGS) {
      expect(mocks.revalidateTag).toHaveBeenCalledWith(tag, { expire: 0 });
    }
  });
});
