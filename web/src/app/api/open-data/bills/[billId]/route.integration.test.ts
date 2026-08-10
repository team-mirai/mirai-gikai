import {
  cleanupTestBill,
  createTestBill,
  createTestBillContent,
  createTestMiraiStance,
} from "@test-utils/utils";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "./route";

function callRoute(billId: string, query = ""): Promise<Response> {
  const request = new Request(
    `http://localhost:3000/api/open-data/bills/${billId}${query}`,
    // レートリミットの干渉を避けるためテスト専用IPを使う
    { headers: { "x-forwarded-for": "198.51.100.2" } }
  );
  return GET(request, { params: Promise.resolve({ billId }) });
}

describe("GET /api/open-data/bills/[billId]", () => {
  let publishedBillId: string;
  let draftBillId: string;

  beforeAll(async () => {
    const published = await createTestBill({ publish_status: "published" });
    publishedBillId = published.id;
    await createTestBillContent(publishedBillId, {
      difficulty_level: "normal",
      content: "本文テスト",
    });
    await createTestMiraiStance(publishedBillId, { type: "against" });

    const draft = await createTestBill({ publish_status: "draft" });
    draftBillId = draft.id;
    await createTestBillContent(draftBillId, { difficulty_level: "normal" });
  });

  afterAll(async () => {
    await cleanupTestBill(publishedBillId);
    await cleanupTestBill(draftBillId);
  });

  it("billId がUUID形式でない場合は400を返す", async () => {
    const res = await callRoute("not-a-uuid");
    expect(res.status).toBe(400);
  });

  it("difficulty が不正な場合は400を返す", async () => {
    const res = await callRoute(publishedBillId, "?difficulty=expert");
    expect(res.status).toBe(400);
  });

  it("非公開の議案は404を返す", async () => {
    const res = await callRoute(draftBillId);
    expect(res.status).toBe(404);
  });

  it("公開中の議案を本文・賛否付きでno-storeで返す", async () => {
    const res = await callRoute(publishedBillId);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const body = await res.json();
    expect(body.billId).toBe(publishedBillId);
    expect(body.content).toBe("本文テスト");
    expect(body.miraiStance).toEqual({
      type: "against",
      label: "反対",
      comment: expect.any(String),
    });
  });
});
