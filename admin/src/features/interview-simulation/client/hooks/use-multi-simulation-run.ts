import { useCallback, useRef, useState } from "react";
import type { MultiSimulationRunRequest } from "../../shared/types";
import { readMultiNdjsonStream } from "../utils/read-multi-ndjson-stream";
import {
  initialMultiSimulationState,
  type MultiSimulationState,
  reduceMultiSimulationState,
} from "../utils/reduce-multi-simulation-state";

export interface UseMultiSimulationRun {
  state: MultiSimulationState;
  isRunning: boolean;
  error: string | null;
  run: (body: MultiSimulationRunRequest) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

/**
 * 複数ペルソナシミュ API をストリーミング呼び出しして state を更新するフック。
 * - AbortController で中断可能
 * - エラーは error 状態にまとめる（ストリーム読み込み自体の失敗）
 * - スロット個別のエラーは state.slots[i].error に入る（stream の persona_error 由来）
 */
export function useMultiSimulationRun(): UseMultiSimulationRun {
  const [state, setState] = useState<MultiSimulationState>(
    initialMultiSimulationState
  );
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (body: MultiSimulationRunRequest) => {
    // 前回の run が走っていれば abort してから新規に開始。
    // UI のボタン制御で防いでいる想定でも、fast click / 外部 trigger で
    // 2 本走ると両ストリームの setState が交互に入って state が壊れるので
    // hook 側でも多重実行を防御する。
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setError(null);
    setState(initialMultiSimulationState);
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/interview-simulation/run-multi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          data?.error ??
            `シミュレーション API がエラー応答 (status ${response.status})`
        );
        return;
      }

      await readMultiNdjsonStream(
        response,
        (event) => {
          setState((prev) => reduceMultiSimulationState(prev, event));
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // 中断は致命エラーではない
        return;
      }
      console.error("Multi-simulation streaming failed:", err);
      setError(
        err instanceof Error ? err.message : "シミュレーションに失敗しました"
      );
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setState(initialMultiSimulationState);
    setError(null);
  }, []);

  return { state, isRunning, error, run, stop, reset };
}
