import "server-only";

import { BILL_VIDEO_KINDS } from "@mirai-gikai/shared/bill-videos/kinds";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  findBillIdById,
  findBillVideosByBillId,
  upsertBillVideo,
} from "@/features/bills-edit/server/repositories/bill-edit-repository";
import {
  type BillVideo,
  billVideoInputSchema,
} from "@/features/bills-edit/shared/types/bill-videos";
import { invalidateBillsCache } from "../utils/invalidate-bills-cache";
import { jsonResult } from "../utils/json-result";

function toToolOutput(video: BillVideo) {
  return {
    kind: video.kind,
    youtubeVideoId: video.youtube_video_id,
    title: video.title,
  };
}

export function registerBillVideosTools(server: McpServer): void {
  server.registerTool(
    "get_bill_videos",
    {
      title: "議案の動画を取得",
      description:
        "指定議案に紐づく YouTube 動画を、議論の種類（kind）ごとに返す。kind は stance_decision（賛否を決めた時の議論）/ caucus（議員団での議論）で、1種類につき最大1本。紐づいていない種類は含まない。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const videos = await findBillVideosByBillId(billId);
      return jsonResult({ billId, videos: videos.map(toToolOutput) });
    }
  );

  server.registerTool(
    "set_bill_video",
    {
      title: "議案の動画を登録・置き換え",
      description:
        "指定議案に YouTube 動画を1本紐づける。kind は stance_decision（賛否を決めた時の議論）/ caucus（議員団での議論）。その種類に既に動画があれば置き換え、置き換え前の動画を replaced で返す（無ければ null）。url は YouTube の動画URLまたは11文字の動画ID、title は議案ページに表示するタイトル（1〜200文字）。議案が無ければ ok=false, reason=not_found を返す。",
      inputSchema: {
        billId: z.string().uuid(),
        kind: z.enum(BILL_VIDEO_KINDS),
        url: z.string().min(1),
        title: z.string().min(1),
      },
    },
    async ({ billId, kind, url, title }) => {
      const parsed = billVideoInputSchema.safeParse({ url, title });
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "入力内容が不正です"
        );
      }
      // url・title はともに min(1) なので、ここでは「登録しない（null）」にはならない
      const video = parsed.data;
      if (video === null) {
        throw new Error("YouTube の動画URLとタイトルを指定してください");
      }

      if ((await findBillIdById(billId)) === null) {
        return jsonResult({ ok: false, reason: "not_found" });
      }

      const previous = (await findBillVideosByBillId(billId)).find(
        (v) => v.kind === kind
      );
      const saved = await upsertBillVideo(billId, kind, video);
      await invalidateBillsCache();

      return jsonResult({
        ok: true,
        billId,
        video: toToolOutput(saved),
        replaced: previous ? toToolOutput(previous) : null,
      });
    }
  );
}
