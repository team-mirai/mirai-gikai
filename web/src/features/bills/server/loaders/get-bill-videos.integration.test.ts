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

  it("議案の動画を種類付きで返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    await adminClient.from("bill_videos").insert([
      {
        bill_id: bill.id,
        kind: "stance_decision",
        youtube_video_id: "AAAAAAAAAAA",
        title: "賛否MTG",
      },
      {
        bill_id: bill.id,
        kind: "caucus",
        youtube_video_id: "BBBBBBBBBBB",
        title: "議員団MTG",
      },
    ]);

    const result = await getBillVideos(bill.id);

    expect(
      result
        .map(({ kind, youtube_video_id }) => ({ kind, youtube_video_id }))
        .sort((a, b) => a.youtube_video_id.localeCompare(b.youtube_video_id))
    ).toEqual([
      { kind: "stance_decision", youtube_video_id: "AAAAAAAAAAA" },
      { kind: "caucus", youtube_video_id: "BBBBBBBBBBB" },
    ]);
  });

  it("動画が無い議案では空配列を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);

    expect(await getBillVideos(bill.id)).toEqual([]);
  });
});
