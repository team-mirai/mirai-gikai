import "server-only";

import { after } from "next/server";
import { registerNodeTelemetry } from "@/lib/telemetry/register";
import { updateVersionStatus } from "../repositories/user-topic-analysis-repository";
import { verifyStepInternalAuth } from "./trigger-step";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * 内部 step route 共通ハンドラ。Bearer 検証 → 即レスポンス →
 * after() で重い処理を実行（各 step は別リクエスト＝独立した 300 秒枠で動く）。
 * 失敗時は version を failed にする。
 */
export async function handleStepRoute(
  request: Request,
  stepLabel: string,
  run: (versionId: string, billId: string) => Promise<void>,
  options: {
    triggerNext?: (versionId: string, billId: string) => Promise<void>;
  } = {}
): Promise<Response> {
  try {
    verifyStepInternalAuth(request);
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  let versionId: string;
  let billId: string;
  try {
    const body = await request.json();
    versionId = body.versionId;
    billId = body.billId;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  after(async () => {
    try {
      await registerNodeTelemetry();
      await run(versionId, billId);
    } catch (error) {
      // ステップ本体の失敗のみ version を failed にする。
      console.error(`[UserTopicAnalysis] ${stepLabel} failed:`, error);
      await updateVersionStatus(
        versionId,
        "failed",
        error instanceof Error ? error.message : `${stepLabel} failed`
      ).catch((e) => console.error("[UserTopicAnalysis] status update:", e));
      return;
    }

    // 本体は成功済み。次ステップ起動の失敗（内部 fetch のレスポンス喪失等）は
    // version を failed にしない（誤表示で多重起動を招くのを避ける・best-effort 連鎖）。
    if (options.triggerNext) {
      try {
        await options.triggerNext(versionId, billId);
      } catch (error) {
        console.error(
          `[UserTopicAnalysis] ${stepLabel}: next-step trigger failed (work already succeeded):`,
          error
        );
      }
    }
  });

  return json({ accepted: true });
}
