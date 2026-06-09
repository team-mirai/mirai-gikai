import { describe, expect, it } from "vitest";
import {
  STALE_PENDING_MS,
  STALE_RUNNING_MS,
} from "../shared/constants";
import { isStaleActiveVersion } from "./is-stale-active-version";

const NOW = Date.parse("2026-06-09T12:00:00.000Z");
const isoAgo = (ms: number) => new Date(NOW - ms).toISOString();

describe("isStaleActiveVersion", () => {
  it("起動されたばかりの pending は失効ではない", () => {
    const v = {
      status: "pending",
      started_at: null,
      created_at: isoAgo(60_000),
    };
    expect(isStaleActiveVersion(v, NOW)).toBe(false);
  });

  it("しきい値を超えて pending のままなら失効", () => {
    const v = {
      status: "pending",
      started_at: null,
      created_at: isoAgo(STALE_PENDING_MS + 1_000),
    };
    expect(isStaleActiveVersion(v, NOW)).toBe(true);
  });

  it("running 中でしきい値内なら失効ではない", () => {
    const v = {
      status: "running",
      started_at: isoAgo(10 * 60_000),
      created_at: isoAgo(11 * 60_000),
    };
    expect(isStaleActiveVersion(v, NOW)).toBe(false);
  });

  it("running がしきい値を超えていれば失効（task-timeout 超過等）", () => {
    const v = {
      status: "running",
      started_at: isoAgo(STALE_RUNNING_MS + 60_000),
      created_at: isoAgo(STALE_RUNNING_MS + 120_000),
    };
    expect(isStaleActiveVersion(v, NOW)).toBe(true);
  });

  it("running で started_at が null なら created_at を基準にする", () => {
    const v = {
      status: "running",
      started_at: null,
      created_at: isoAgo(STALE_RUNNING_MS + 1_000),
    };
    expect(isStaleActiveVersion(v, NOW)).toBe(true);
  });

  it("completed/failed は active ではないので失効扱いしない", () => {
    expect(
      isStaleActiveVersion(
        { status: "completed", started_at: isoAgo(1), created_at: isoAgo(2) },
        NOW
      )
    ).toBe(false);
    expect(
      isStaleActiveVersion(
        { status: "failed", started_at: null, created_at: isoAgo(99 * 60_000) },
        NOW
      )
    ).toBe(false);
  });

  it("不正な日時は失効扱いしない（安全側）", () => {
    const v = { status: "pending", started_at: null, created_at: "not-a-date" };
    expect(isStaleActiveVersion(v, NOW)).toBe(false);
  });
});
