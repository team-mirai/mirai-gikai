import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "@test-utils/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

// unstable_cache はモジュール初期化時に評価されるため、
// テストファイル内で vi.mock → 動的インポートの順序を保証する必要がある。
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));
const { getBillVideos } = await import("./get-bill-videos");

describe("getBillVideos 統合テスト", () => {
  const billIds: string[] = [];

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
  });

  it("議案の動画を表示順で返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    await adminClient.rpc("replace_bill_videos", {
      p_bill_id: bill.id,
      p_videos: [
        { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
        { youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
      ],
    });

    const result = await getBillVideos(bill.id);

    expect(
      result.map(({ youtube_video_id, title }) => ({ youtube_video_id, title }))
    ).toEqual([
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
    ]);
  });

  it("動画が無い議案では空配列を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);

    expect(await getBillVideos(bill.id)).toEqual([]);
  });
});
