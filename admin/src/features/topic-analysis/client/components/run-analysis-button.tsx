"use client";

import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ANALYSIS_STEPS, ANALYSIS_TOTAL_STEPS } from "../../shared/constants";
import { formatDurationMs } from "../../shared/utils/format-analysis-duration";

interface RunAnalysisButtonProps {
  billId: string;
}

type AnalysisStatus = {
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
};

function getStepOrder(stepLabel: string | null): number {
  if (!stepLabel) return 0;
  const step = Object.values(ANALYSIS_STEPS).find((s) => s.label === stepLabel);
  return step?.order ?? 0;
}

export function RunAnalysisButton({ billId }: RunAnalysisButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(
    null
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const versionIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const errorCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const pollStatus = useCallback(async () => {
    if (!versionIdRef.current) return;

    try {
      const res = await fetch(
        `/api/topic-analysis/status?versionId=${versionIdRef.current}`
      );
      if (!res.ok) {
        errorCountRef.current++;
        if (errorCountRef.current >= 15) {
          stopPolling();
          setIsRunning(false);
          setError("ステータス取得に繰り返し失敗しました");
        }
        return;
      }

      errorCountRef.current = 0;
      const data: AnalysisStatus = await res.json();
      setAnalysisStatus(data);

      if (data.status === "completed") {
        stopPolling();
        setIsRunning(false);
        router.push(`/bills/${billId}/topic-analysis/${versionIdRef.current}`);
        router.refresh();
      } else if (data.status === "failed") {
        stopPolling();
        setIsRunning(false);
        setError(data.errorMessage ?? "解析に失敗しました");
      }
    } catch {
      errorCountRef.current++;
      if (errorCountRef.current >= 15) {
        stopPolling();
        setIsRunning(false);
        setError("ステータス取得に繰り返し失敗しました");
      }
    }
  }, [billId, router, stopPolling]);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setAnalysisStatus(null);
    setElapsedMs(0);
    errorCountRef.current = 0;

    try {
      const response = await fetch("/api/topic-analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "解析の実行に失敗しました");
        setIsRunning(false);
        return;
      }

      versionIdRef.current = data.versionId;
      startTimeRef.current = Date.now();

      // 経過時間タイマー（1秒間隔）
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 1000);

      // ステータスポーリング（2秒間隔）
      pollingRef.current = setInterval(pollStatus, 2000);
      // 即座に最初のポーリングも実行
      pollStatus();
    } catch (err) {
      console.error("Topic analysis failed:", err);
      setError("解析の実行中にエラーが発生しました");
      setIsRunning(false);
    }
  };

  const currentStepOrder = getStepOrder(analysisStatus?.currentStep ?? null);
  const progressPercent = isRunning
    ? Math.round((currentStepOrder / ANALYSIS_TOTAL_STEPS) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <Button onClick={handleRun} disabled={isRunning}>
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isRunning ? "解析実行中..." : "新しい解析を実行"}
      </Button>

      {isRunning && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {analysisStatus?.currentStep
                ? `Step ${currentStepOrder}/${ANALYSIS_TOTAL_STEPS}: ${analysisStatus.currentStep}`
                : "開始中..."}
            </span>
            <span>{formatDurationMs(elapsedMs)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
