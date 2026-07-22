import { beforeAll, describe, expect, it } from "vitest";
import { getRetryAfterSeconds } from "@/features/open-data/shared/utils/rate-limit-window";
import { GET } from "./route";

// レートリミット設定はリクエスト毎に env から読まれる
beforeAll(() => {
  process.env.OPEN_DATA_RATE_LIMIT_PER_IP = "3";
});

function buildRequest(params: { query?: string; ip?: string }): Request {
  const url = `http://localhost:3000/api/open-data/interviews${params.query ?? ""}`;
  return new Request(url, {
    headers: params.ip ? { "x-forwarded-for": params.ip } : {},
  });
}

/** テストごとに一意なIPを払い出してレートリミットの干渉を防ぐ */
let ipCounter = 0;
function uniqueIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

describe("GET /api/open-data/interviews", () => {
  it("agreeToTerms がない場合は403と規約URLを返す", async () => {
    const res = await GET(buildRequest({ ip: uniqueIp() }));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.termsUrl).toContain("/developers/interview-data-terms");
  });

  it("limit が不正な場合は400を返す", async () => {
    const res = await GET(
      buildRequest({ query: "?agreeToTerms=true&limit=0", ip: uniqueIp() })
    );
    expect(res.status).toBe(400);

    const res2 = await GET(
      buildRequest({ query: "?agreeToTerms=true&limit=abc", ip: uniqueIp() })
    );
    expect(res2.status).toBe(400);
  });

  it("cursor が不正な場合は400を返す", async () => {
    const res = await GET(
      buildRequest({
        query: "?agreeToTerms=true&cursor=invalid!!",
        ip: uniqueIp(),
      })
    );
    expect(res.status).toBe(400);
  });

  it("同意済みリクエストにはitems・license・termsUrlをno-storeで返す", async () => {
    const res = await GET(
      buildRequest({ query: "?agreeToTerms=true", ip: uniqueIp() })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.license).toBe("CC BY 4.0");
    expect(body.termsUrl).toContain("/developers/interview-data-terms");
    expect("nextCursor" in body).toBe(true);
  });

  it("IP単位のレートリミットを超えると429とRetry-Afterを返す", async () => {
    const ip = uniqueIp();
    const query = "?agreeToTerms=true&limit=1";

    // テスト中にウィンドウが切り替わるとカウントがリセットされて
    // フレークするため、残り時間が少ない場合は次のウィンドウまで待つ
    const remaining = getRetryAfterSeconds(new Date(), 60);
    if (remaining < 5) {
      await new Promise((resolve) =>
        setTimeout(resolve, remaining * 1000 + 100)
      );
    }

    for (let i = 0; i < 3; i++) {
      const res = await GET(buildRequest({ query, ip }));
      expect(res.status).toBe(200);
    }

    const globalCountBefore = await fetchGlobalCount();
    const blocked = await GET(buildRequest({ query, ip }));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);

    // IP超過で拒否されたリクエストはグローバル枠を消費しない
    expect(await fetchGlobalCount()).toBe(globalCountBefore);
  });
});

async function fetchGlobalCount(): Promise<number> {
  const { adminClient } = await import("@test-utils/utils");
  const { data, error } = await adminClient
    .from("api_rate_limits")
    .select("request_count")
    .eq("key", "open-data:global")
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`api_rate_limits 取得失敗: ${error.message}`);
  return data?.request_count ?? 0;
}
