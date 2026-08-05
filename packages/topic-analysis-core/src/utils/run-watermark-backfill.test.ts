import { describe, expect, it, vi } from "vitest";
import {
  type BackfillItemStatus,
  runWatermarkBackfill,
  runWatermarkBackfillChunk,
  type WatermarkBackfillSteps,
} from "./run-watermark-backfill";

type Target = { id: string; status: BackfillItemStatus };

function buildSteps(
  overrides: Partial<WatermarkBackfillSteps<Target>> = {}
): WatermarkBackfillSteps<Target> {
  return {
    label: "test",
    chunkSize: 10,
    concurrency: 2,
    findTargets: async () => [],
    processTarget: async (t) => ({ status: t.status }),
    countRemaining: async () => 0,
    ...overrides,
  };
}

describe("runWatermarkBackfillChunk", () => {
  it("状態ごとに集計する", async () => {
    const targets: Target[] = [
      { id: "a", status: "updated" },
      { id: "b", status: "skipped" },
      { id: "c", status: "failed" },
      { id: "d", status: "updated" },
    ];
    const result = await runWatermarkBackfillChunk(
      buildSteps({
        findTargets: async () => targets,
        countRemaining: async () => 1,
      })
    );

    expect(result).toEqual({
      processed: 4,
      updated: 2,
      skipped: 1,
      failed: 1,
      remaining: 1,
    });
  });

  it("chunkSize を findTargets に渡す", async () => {
    const findTargets = vi.fn(async () => []);
    await runWatermarkBackfillChunk(buildSteps({ chunkSize: 7, findTargets }));

    expect(findTargets).toHaveBeenCalledWith(7);
  });

  it("concurrency 件ずつのウェーブに分けて処理する", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const targets: Target[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      status: "updated" as const,
    }));

    await runWatermarkBackfillChunk(
      buildSteps({
        concurrency: 2,
        findTargets: async () => targets,
        processTarget: async (t) => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await Promise.resolve();
          inFlight -= 1;
          return { status: t.status };
        },
      })
    );

    expect(maxInFlight).toBeLessThanOrEqual(2);
  });
});

describe("runWatermarkBackfill", () => {
  it("remaining が 0 になるまでチャンクを繰り返す", async () => {
    const remainings = [2, 1, 0];
    let calls = 0;
    const findTargets = vi.fn(async () => [
      { id: "a", status: "updated" as const },
    ]);

    await runWatermarkBackfill(
      buildSteps({
        findTargets,
        countRemaining: async () => remainings[calls++] ?? 0,
      })
    );

    expect(findTargets).toHaveBeenCalledTimes(3);
  });

  it("対象が無ければ1チャンクで止まる", async () => {
    const findTargets = vi.fn(async () => []);

    await runWatermarkBackfill(
      buildSteps({ findTargets, countRemaining: async () => 5 })
    );

    expect(findTargets).toHaveBeenCalledTimes(1);
  });

  // 全件失敗し続けるとウォーターマークが進まず remaining が減らないため、
  // ここで止めないと無限ループになる。
  it("remaining が減らなくなったら停止する", async () => {
    const findTargets = vi.fn(async () => [
      { id: "a", status: "failed" as const },
    ]);

    await runWatermarkBackfill(
      buildSteps({ findTargets, countRemaining: async () => 3 })
    );

    expect(findTargets).toHaveBeenCalledTimes(2);
  });
});
