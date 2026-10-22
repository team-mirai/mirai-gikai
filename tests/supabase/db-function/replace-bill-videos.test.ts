import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminClient, cleanupTestBill, createTestBill } from "../utils";

async function replaceBillVideos(
  billId: string,
  videos: Array<{ youtube_video_id: string; title: string }>
) {
  return adminClient.rpc("replace_bill_videos", {
    p_bill_id: billId,
    p_videos: videos,
  });
}

async function findVideos(billId: string) {
  const { data, error } = await adminClient
    .from("bill_videos")
    .select("youtube_video_id, title, display_order")
    .eq("bill_id", billId)
    .order("display_order", { ascending: true });
  if (error) throw new Error(`bill_videos 取得失敗: ${error.message}`);
  return data;
}

describe("replace_bill_videos", () => {
  let billId: string;
  let otherBillId: string;

  beforeEach(async () => {
    billId = (await createTestBill()).id;
    otherBillId = (await createTestBill()).id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestBill(otherBillId);
  });

  it("配列順を display_order（0始まり）として保存する", async () => {
    const { error } = await replaceBillVideos(billId, [
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
    ]);

    expect(error).toBeNull();
    expect(await findVideos(billId)).toEqual([
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回", display_order: 0 },
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回", display_order: 1 },
    ]);
  });

  it("既存の動画を丸ごと置き換え、並べ替えも反映する", async () => {
    await replaceBillVideos(billId, [
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
    ]);

    const { error } = await replaceBillVideos(billId, [
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
      { youtube_video_id: "CCCCCCCCCCC", title: "第3回" },
    ]);

    expect(error).toBeNull();
    expect(await findVideos(billId)).toEqual([
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回", display_order: 0 },
      { youtube_video_id: "CCCCCCCCCCC", title: "第3回", display_order: 1 },
    ]);
  });

  it("空配列を渡すと全件削除する", async () => {
    await replaceBillVideos(billId, [
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
    ]);

    const { error } = await replaceBillVideos(billId, []);

    expect(error).toBeNull();
    expect(await findVideos(billId)).toEqual([]);
  });

  it("他の議案の動画には影響しない", async () => {
    await replaceBillVideos(otherBillId, [
      { youtube_video_id: "ZZZZZZZZZZZ", title: "別議案" },
    ]);

    await replaceBillVideos(billId, [
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
    ]);
    await replaceBillVideos(billId, []);

    expect(await findVideos(otherBillId)).toEqual([
      { youtube_video_id: "ZZZZZZZZZZZ", title: "別議案", display_order: 0 },
    ]);
  });

  it("不正な動画IDが含まれると失敗し、既存の動画は残る", async () => {
    await replaceBillVideos(billId, [
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
    ]);

    const { error } = await replaceBillVideos(billId, [
      { youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
      { youtube_video_id: "invalid", title: "不正" },
    ]);

    expect(error).not.toBeNull();
    expect(await findVideos(billId)).toEqual([
      { youtube_video_id: "AAAAAAAAAAA", title: "第1回", display_order: 0 },
    ]);
  });
});
