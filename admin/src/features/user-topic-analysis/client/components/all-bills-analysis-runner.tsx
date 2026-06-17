"use client";

import { CheckCircle2, Loader2, Play } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AnalysisStrategy = "full" | "incremental";

/**
 * 全議案トピック分析の実行ボタン。
 * 1 ジョブで全議案を順次処理するため進捗は粗く、起動の成否のみ表示する
 * （詳細は各議案のトピック分析ページで確認する）。
 */
export function AllBillsAnalysisRunner() {
  const [strategy, setStrategy] = useState<AnalysisStrategy>("incremental");
  const [isStarting, setIsStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    setError(null);
    setStarted(false);
    setIsStarting(true);
    try {
      const res = await fetch("/api/user-topic-analysis/dispatch-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `実行開始に失敗しました (${res.status})`);
      }
      setStarted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "実行開始に失敗しました");
    } finally {
      setIsStarting(false);
    }
  }, [strategy]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="all-bills-strategy" className="text-sm">
          実行方式
        </Label>
        <Select
          value={strategy}
          onValueChange={(v) => setStrategy(v as AnalysisStrategy)}
          disabled={isStarting}
        >
          <SelectTrigger id="all-bills-strategy" className="w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="incremental">
              差分追加（新規意見のみ・低コスト・推奨）
            </SelectItem>
            <SelectItem value="full">
              フル再分析（全意見を再抽出・高コスト）
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          差分追加:
          各議案で「まだ抽出されていない新規意見」だけを抽出し、既存トピックへ追加します。新規意見が無い議案はスキップします。
        </p>
      </div>

      {/* 起動後はボタンを無効化し、同一ページからの多重起動（全議案の重複分析・コスト増）を防ぐ。
          再実行したい場合はページを再読み込みする。 */}
      <Button
        onClick={handleRun}
        disabled={isStarting || started}
        className="w-fit"
      >
        {isStarting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        全議案トピック分析を実行
      </Button>

      {started && (
        <p className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="size-4" />
          実行を開始しました。全議案を順次処理するため完了まで時間がかかります。多重起動を避けるため、完了前の再実行は控えてください（再実行する場合はページを再読み込み）。進捗は各議案のトピック分析ページで確認してください。
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
