"use client";

import { Loader2, Play, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type BackfillStatus = {
  pending: number;
  total: number;
  processed: number;
};

const POLL_INTERVAL_MS = 5000;

export function OpinionBackfillRunner() {
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (): Promise<BackfillStatus | null> => {
    const res = await fetch("/api/interview-opinion-backfill/status");
    if (!res.ok) {
      throw new Error(`ステータス取得に失敗しました (${res.status})`);
    }
    const data = (await res.json()) as BackfillStatus;
    setStatus(data);
    // 取得成功時は残留エラー表示をクリアする。
    setError(null);
    return data;
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    fetchStatus().catch((e) => setError(e.message));
    return () => stopPolling();
  }, [fetchStatus, stopPolling]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    setIsRunning(true);
    pollingRef.current = setInterval(async () => {
      try {
        const data = await fetchStatus();
        if (data && data.pending === 0) {
          stopPolling();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "ポーリングに失敗しました");
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchStatus, stopPolling]);

  const handleRun = useCallback(async () => {
    setError(null);
    setIsStarting(true);
    try {
      const res = await fetch("/api/interview-opinion-backfill/dispatch", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`実行開始に失敗しました (${res.status})`);
      }
      await fetchStatus();
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : "実行開始に失敗しました");
    } finally {
      setIsStarting(false);
    }
  }, [fetchStatus, startPolling]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleRun} disabled={isStarting || isRunning}>
          {isStarting || isRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isRunning ? "実行中…" : "再抽出バックフィルを実行"}
        </Button>
        <Button
          variant="outline"
          onClick={() => fetchStatus().catch((e) => setError(e.message))}
          disabled={isStarting}
        >
          <RefreshCw className="size-4" />
          状況を更新
        </Button>
      </div>

      {status && (
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">全レポート</dt>
            <dd className="font-semibold tabular-nums">{status.total}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">処理済み</dt>
            <dd className="font-semibold tabular-nums">{status.processed}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">未処理</dt>
            <dd className="font-semibold tabular-nums">{status.pending}</dd>
          </div>
        </dl>
      )}

      {isRunning && (
        <p className="text-sm text-muted-foreground">
          バックグラウンドで処理中です。状況は自動更新されます。
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
