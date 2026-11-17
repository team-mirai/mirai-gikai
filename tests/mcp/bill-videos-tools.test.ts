import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerBillVideosTools } from "../../admin/src/features/mcp/server/tools/register-bill-videos-tools";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

type VideoOutput = { kind: string; youtubeVideoId: string; title: string };

type SetResult =
  | {
      ok: true;
      billId: string;
      video: VideoOutput;
      replaced: VideoOutput | null;
    }
  | { ok: false; reason: string };

describe("MCP bill-videos tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerBillVideosTools(registry.asMcpServer());
  });

  afterEach(async () => {
    // bill_videos は bills への ON DELETE CASCADE なので bill 削除で一緒に消える
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  async function createBill() {
    const bill = await createTestBill();
    billIds.push(bill.id);
    return bill;
  }

  it("動画が無い議案は空配列を返す", async () => {
    const bill = await createBill();

    const result = await registry.callTool<{ videos: VideoOutput[] }>(
      "get_bill_videos",
      { billId: bill.id }
    );

    expect(result.videos).toEqual([]);
  });

  it("URL から動画IDを取り出して登録し、取得できる", async () => {
    const bill = await createBill();

    const set = await registry.callTool<SetResult>("set_bill_video", {
      billId: bill.id,
      kind: "caucus",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      title: "議員団会議",
    });
    const got = await registry.callTool<{ videos: VideoOutput[] }>(
      "get_bill_videos",
      { billId: bill.id }
    );

    expect(set).toMatchObject({
      ok: true,
      video: {
        kind: "caucus",
        youtubeVideoId: "abcdefghijk",
        title: "議員団会議",
      },
      replaced: null,
    });
    expect(got.videos).toEqual([
      { kind: "caucus", youtubeVideoId: "abcdefghijk", title: "議員団会議" },
    ]);
  });

  it("同じ種類に登録すると置き換え、置き換え前の動画を返す。他の種類は残る", async () => {
    const bill = await createBill();
    await registry.callTool("set_bill_video", {
      billId: bill.id,
      kind: "stance_decision",
      url: "aaaaaaaaaaa",
      title: "賛否検討会 1",
    });
    await registry.callTool("set_bill_video", {
      billId: bill.id,
      kind: "caucus",
      url: "ccccccccccc",
      title: "議員団会議",
    });

    const result = await registry.callTool<SetResult>("set_bill_video", {
      billId: bill.id,
      kind: "stance_decision",
      url: "https://youtu.be/bbbbbbbbbbb",
      title: "賛否検討会 2",
    });

    expect(result).toMatchObject({
      ok: true,
      video: { youtubeVideoId: "bbbbbbbbbbb", title: "賛否検討会 2" },
      replaced: { youtubeVideoId: "aaaaaaaaaaa", title: "賛否検討会 1" },
    });
    const { data } = await adminClient
      .from("bill_videos")
      .select("kind, youtube_video_id")
      .eq("bill_id", bill.id)
      .order("kind");
    expect(data).toEqual([
      { kind: "stance_decision", youtube_video_id: "bbbbbbbbbbb" },
      { kind: "caucus", youtube_video_id: "ccccccccccc" },
    ]);
  });

  it("存在しない議案には登録せず not_found を返す", async () => {
    const result = await registry.callTool<SetResult>("set_bill_video", {
      billId: "00000000-0000-4000-8000-000000000000",
      kind: "caucus",
      url: "abcdefghijk",
      title: "議員団会議",
    });

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("YouTube の URL でなければ受け付けない", async () => {
    const bill = await createBill();

    await expect(
      registry.callTool("set_bill_video", {
        billId: bill.id,
        kind: "caucus",
        url: "https://example.com/watch?v=abcdefghijk",
        title: "議員団会議",
      })
    ).rejects.toThrow("YouTube の動画URLを入力してください");
  });

  it("200文字を超えるタイトルは受け付けない", async () => {
    const bill = await createBill();

    await expect(
      registry.callTool("set_bill_video", {
        billId: bill.id,
        kind: "caucus",
        url: "abcdefghijk",
        title: "あ".repeat(201),
      })
    ).rejects.toThrow("200文字以内");
  });

  it("2つのツールを登録する", () => {
    expect(registry.toolNames().sort()).toEqual([
      "get_bill_videos",
      "set_bill_video",
    ]);
  });
});
