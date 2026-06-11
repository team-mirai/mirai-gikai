"use client";

import { Loader2, Play, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHAT_MODEL_GROUPS,
  DEFAULT_MODEL_LABEL,
} from "@/features/interview-config/shared/utils/chat-model-options";

type BillOption = { id: string; name: string };

type BackfillScope = "pending" | "all";

type BackfillStatus = {
  pending: number;
  total: number;
  processed: number;
};

const POLL_INTERVAL_MS = 5000;
// 「全議案」を表す Select のセンチネル値（Radix は空文字の value を許さないため）。
const ALL_BILLS = "__all__";
// 「既定モデル（OPINION_BACKFILL_MODEL）」を表すセンチネル値。
const DEFAULT_MODEL = "__default__";

export function OpinionBackfillRunner({ bills }: { bills: BillOption[] }) {
  const [billValue, setBillValue] = useState<string>(ALL_BILLS);
  const [scope, setScope] = useState<BackfillScope>("pending");
  const [modelValue, setModelValue] = useState<string>(DEFAULT_MODEL);
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const billId = billValue === ALL_BILLS ? undefined : billValue;
  const model = modelValue === DEFAULT_MODEL ? undefined : modelValue;
  // 「全部」は議案指定時のみ許可（全議案 × 全部は高コストなので不可）。
  const allScopeDisabled = !billId;

  const fetchStatus = useCallback(async (): Promise<BackfillStatus | null> => {
    const query = billId ? `?billId=${encodeURIComponent(billId)}` : "";
    const res = await fetch(`/api/interview-opinion-backfill/status${query}`);
    if (!res.ok) {
      throw new Error(`ステータス取得に失敗しました (${res.status})`);
    }
    const data = (await res.json()) as BackfillStatus;
    setStatus(data);
    // 取得成功時は残留エラー表示をクリアする。
    setError(null);
    return data;
  }, [billId]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // 議案を「全議案」に戻したら、許可されない「全部」を pending に戻す。
  const handleBillChange = useCallback(
    (value: string) => {
      setBillValue(value);
      if (value === ALL_BILLS && scope === "all") {
        setScope("pending");
      }
    },
    [scope]
  );

  // 議案変更時に進捗を取り直す（実行中ポーリング中は触らない）。
  useEffect(() => {
    if (isRunning) return;
    fetchStatus().catch((e) => setError(e.message));
  }, [fetchStatus, isRunning]);

  useEffect(() => () => stopPolling(), [stopPolling]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, scope, model }),
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
  }, [billId, scope, model, fetchStatus, startPolling]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="backfill-bill">対象議案</Label>
          <Select
            value={billValue}
            onValueChange={handleBillChange}
            disabled={isRunning}
          >
            <SelectTrigger id="backfill-bill">
              <SelectValue placeholder="議案を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BILLS}>全議案</SelectItem>
              {bills.map((bill) => (
                <SelectItem key={bill.id} value={bill.id}>
                  {bill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="backfill-scope">対象範囲</Label>
          <Select
            value={scope}
            onValueChange={(v) => setScope(v as BackfillScope)}
            disabled={isRunning}
          >
            <SelectTrigger id="backfill-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">未再抽出のみ</SelectItem>
              <SelectItem value="all" disabled={allScopeDisabled}>
                全部（再抽出済みも含む）
              </SelectItem>
            </SelectContent>
          </Select>
          {allScopeDisabled && (
            <p className="text-xs text-muted-foreground">
              ※「全部」は議案を指定したときのみ選択できます。
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="backfill-model">再抽出モデル</Label>
        <Select
          value={modelValue}
          onValueChange={setModelValue}
          disabled={isRunning}
        >
          <SelectTrigger id="backfill-model" className="sm:max-w-sm">
            <SelectValue placeholder="モデルを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_MODEL}>
              デフォルト（{DEFAULT_MODEL_LABEL}）
            </SelectItem>
            {CHAT_MODEL_GROUPS.map((group) => (
              <SelectGroup key={group.provider}>
                <SelectLabel>{group.provider}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.estimatedCost && (
                      <span className="ml-2 text-muted-foreground">
                        {option.estimatedCost}/回
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          再抽出に使用するモデル。「デフォルト」は上の選択肢に表示されたモデルを使います。
          コスト表記はインタビュー1回あたりの目安で、再抽出1件の実コストとは異なります。
        </p>
      </div>

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
            <dt className="text-muted-foreground">対象レポート</dt>
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
