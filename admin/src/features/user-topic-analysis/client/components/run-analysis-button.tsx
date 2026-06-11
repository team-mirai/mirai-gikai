"use client";

import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type VersionStatus = {
  status: "pending" | "running" | "completed" | "failed";
  current_step: string | null;
  source_opinion_count: number | null;
  error_message: string | null;
};

const POLL_INTERVAL_MS = 4000;

const STEP_LABEL: Record<string, string> = {
  extract: "トピック抽出中",
  merge: "トピック統合中",
  assign: "意見割当中",
  done: "完了処理中",
};

export function RunAnalysisButton({ billId }: { billId: string }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const poll = useCallback(
    (versionId: string) => {
      // 逐次ポーリング: 前回レスポンス完了後に次を予約する。
      // setInterval + async だとレスポンスが間隔を超えた際に多重化・状態競合するため。
      const tick = async () => {
        try {
          const res = await fetch(
            `/api/user-topic-analysis/status?versionId=${versionId}`
          );
          if (!res.ok) throw new Error(`status ${res.status}`);
          const data = (await res.json()) as VersionStatus;
          setStep(data.current_step);
          if (data.status === "completed") {
            stopPolling();
            setIsRunning(false);
            router.refresh();
            return;
          }
          if (data.status === "failed") {
            stopPolling();
            setIsRunning(false);
            setError(data.error_message ?? "分析に失敗しました");
            return;
          }
        } catch (e) {
          stopPolling();
          setIsRunning(false);
          setError(e instanceof Error ? e.message : "ポーリングに失敗しました");
          return;
        }
        pollingRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      };
      pollingRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [router, stopPolling]
  );

  const handleRun = useCallback(async () => {
    setError(null);
    setIsRunning(true);
    setStep(null);
    try {
      const res = await fetch("/api/user-topic-analysis/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });
      if (!res.ok) throw new Error(`実行開始に失敗しました (${res.status})`);
      const data = (await res.json()) as { versionId?: string };
      if (!data.versionId) throw new Error("versionId が取得できませんでした");
      poll(data.versionId);
    } catch (e) {
      setIsRunning(false);
      setError(e instanceof Error ? e.message : "実行開始に失敗しました");
    }
  }, [billId, poll]);

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleRun} disabled={isRunning} className="w-fit">
        {isRunning ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {isRunning ? "分析実行中…" : "トピック分析を実行"}
      </Button>
      {isRunning && (
        <p className="text-sm text-gray-500">
          {step ? (STEP_LABEL[step] ?? step) : "開始中"}
          …（完了まで数分かかります）
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
