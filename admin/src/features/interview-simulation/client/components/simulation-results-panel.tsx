import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Eye,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import { PROMPT_KIND } from "../../shared/constants";
import type { SimulationResult } from "../../shared/types";
import { TranscriptViewer } from "./transcript-viewer";

function formatElapsed(ms: number): string {
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)}秒`;
  let min = Math.floor(totalSec / 60);
  let sec = Math.round(totalSec - min * 60);
  // 丸めで sec が 60 になるケースを繰り上げて「1分60秒」表示を回避
  if (sec === 60) {
    min += 1;
    sec = 0;
  }
  return `${min}分${sec}秒`;
}

interface SimulationResultsPanelProps {
  result: SimulationResult;
}

const KNOWLEDGE_LABEL: Record<string, string> = {
  beginner: "初心者",
  intermediate: "中級",
  expert: "専門家",
};

const LENGTH_LABEL: Record<string, string> = {
  short: "短答",
  medium: "中",
  long: "長文",
};

export function SimulationResultsPanel({
  result,
}: SimulationResultsPanelProps) {
  const currentSim = result.simulations[PROMPT_KIND.current];
  const improvedSim = result.simulations[PROMPT_KIND.improved];

  const currentElapsed = currentSim?.elapsedMs;
  const improvedElapsed = improvedSim?.elapsedMs;

  const vsOriginal = result.evaluationVsOriginal;
  const verdictLabel = vsOriginal
    ? vsOriginal.overall_verdict === "improved_better"
      ? "改善版が優位"
      : vsOriginal.overall_verdict === "improved_worse"
        ? "改善版が劣る"
        : "大きな差はない"
    : null;

  return (
    <section className="space-y-4">
      {/* ── ヒーローサマリ ── */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {verdictLabel && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              {verdictLabel}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {formatElapsed(result.totalElapsedMs)}
              </span>
            </div>
            {improvedElapsed !== undefined && (
              <span className="text-muted-foreground">
                改善版 {formatElapsed(improvedElapsed)}
              </span>
            )}
            {currentElapsed !== undefined && (
              <span className="text-muted-foreground">
                現行 {formatElapsed(currentElapsed)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 改善版 vs 元インタビュー 評価 ── */}
      {vsOriginal && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold">
              AI Judge: 改善版 vs 元の実インタビュー
            </h2>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5">
              {verdictLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            改善版プロンプトでシミュレートしたインタビュアー質問を、
            元の実インタビューのインタビュアー質問と比較した評価です。
          </p>
          <p className="text-sm leading-relaxed bg-muted/40 rounded-md p-3 whitespace-pre-wrap">
            {vsOriginal.summary}
          </p>
          {(vsOriginal.improved_strengths.length > 0 ||
            vsOriginal.improved_weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {vsOriginal.improved_strengths.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-green-600" />
                    改善版が元より良い点
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {vsOriginal.improved_strengths.map((s, i) => (
                      <li key={`${i}-${s}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {vsOriginal.improved_weaknesses.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                    改善版が元より劣る点
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {vsOriginal.improved_weaknesses.map((s, i) => (
                      <li key={`${i}-${s}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {vsOriginal.notable_observations.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                その他の観察
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {vsOriginal.notable_observations.map((o, i) => (
                  <li key={`${i}-${o}`}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── ペルソナ（折り畳み・デフォルト閉） ── */}
      <details className="group rounded-lg border bg-white">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none">
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
          <span className="font-semibold text-sm">ペルソナ</span>
          <div className="flex flex-wrap items-center gap-1.5 ml-2">
            <Badge variant="outline" className="font-normal">
              {result.persona.role_title}
            </Badge>
            <StanceBadge stance={result.persona.stance} />
            <Badge variant="outline" className="font-normal">
              知識:{" "}
              {KNOWLEDGE_LABEL[result.persona.knowledge_level] ??
                result.persona.knowledge_level}
            </Badge>
            <Badge variant="outline" className="font-normal">
              回答:{" "}
              {LENGTH_LABEL[result.persona.typical_response_length] ??
                result.persona.typical_response_length}
            </Badge>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {result.personaModel}
          </span>
        </summary>
        <div className="px-4 pb-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">立場（詳細）</p>
            <p>{result.persona.role_description}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">背景</p>
            <p className="whitespace-pre-wrap">{result.persona.background}</p>
          </div>
          {result.persona.key_concerns.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                気にしている論点
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.persona.key_concerns.map((c, i) => (
                  <Badge key={`${i}-${c}`} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {result.persona.boundaries.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                拒否・回避する話題
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.persona.boundaries.map((b, i) => (
                  <Badge key={`${i}-${b}`} variant="outline">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* ── メイン比較: 元の実インタビュー vs 改善版 sim（report モード時のみ並列） ── */}
      <div
        className={
          result.original
            ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
            : "grid grid-cols-1 gap-4"
        }
      >
        {result.original && (
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">元の実インタビュー</h3>
              <span className="text-xs text-muted-foreground">
                {result.original.conversation.length} ターン
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              シミュレートの目標となる元会話。改善版の回答がこの文体・長さに近いほど精度が高い。
            </p>
            <TranscriptViewer turns={result.original.conversation} />
          </div>
        )}

        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">
              {result.original
                ? "改善版プロンプトのシミュレート結果"
                : "シミュレート結果"}
            </h3>
            {improvedSim ? (
              <span className="text-xs text-muted-foreground">
                {improvedSim.metrics.totalTurns} ターン /{" "}
                {(improvedSim.elapsedMs / 1000).toFixed(1)}秒
              </span>
            ) : null}
          </div>
          {improvedSim ? (
            <>
              <p className="text-xs text-muted-foreground">
                短答 {improvedSim.metrics.shortAnswerCount}件 / 平均文字数: 質問{" "}
                {improvedSim.metrics.avgInterviewerChars} / 回答{" "}
                {improvedSim.metrics.avgIntervieweeChars} / カバレッジ{" "}
                {(improvedSim.metrics.questionCoverage * 100).toFixed(0)}% /
                終了: {improvedSim.stopReason}
              </p>
              <TranscriptViewer turns={improvedSim.transcript} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              シミュレート結果なし
            </p>
          )}
        </div>
      </div>

      {/* ── 現行プロンプトのシミュレート結果（補助・includeCurrent 時のみ） ── */}
      {currentSim && (
        <details className="group rounded-lg border bg-white" open>
          <summary className="flex items-baseline justify-between px-4 py-3 cursor-pointer list-none">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
              <span className="font-semibold text-sm">
                現行プロンプトのシミュレート結果（参考）
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentSim.metrics.totalTurns} ターン /{" "}
              {(currentSim.elapsedMs / 1000).toFixed(1)}秒
            </span>
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              短答 {currentSim.metrics.shortAnswerCount}件 / 平均文字数: 質問{" "}
              {currentSim.metrics.avgInterviewerChars} / 回答{" "}
              {currentSim.metrics.avgIntervieweeChars} / カバレッジ{" "}
              {(currentSim.metrics.questionCoverage * 100).toFixed(0)}% / 終了:{" "}
              {currentSim.stopReason}
            </p>
            <TranscriptViewer turns={currentSim.transcript} />
          </div>
        </details>
      )}
    </section>
  );
}
