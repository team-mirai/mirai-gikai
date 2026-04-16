import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Eye,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import { JUDGE_CRITERIA, PROMPT_KIND } from "../../shared/constants";
import type { JudgeCriterionResult } from "../../shared/schemas";
import type { SimulationResult } from "../../shared/types";
import {
  computeJudgeAggregate,
  formatWinnerLabel,
} from "../../shared/utils/compute-judge-summary";
import { TranscriptViewer } from "./transcript-viewer";

function formatElapsed(ms: number): string {
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)}秒`;
  const min = Math.floor(totalSec / 60);
  const sec = Math.round(totalSec - min * 60);
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

/**
 * 評価軸ごとに current → improved のスコアを棒 + 矢印で可視化する
 */
function CriterionBar({ c }: { c: JudgeCriterionResult }) {
  const def = JUDGE_CRITERIA.find((j) => j.key === c.criterion);
  const delta = c.score_improved - c.score_current;
  const deltaIcon =
    delta > 0 ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : delta < 0 ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : null;

  const bar = (score: number, variant: "current" | "improved") => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2 w-5 rounded-sm ${
            n <= score
              ? variant === "improved"
                ? "bg-primary"
                : "bg-muted-foreground/40"
              : "bg-muted"
          }`}
        />
      ))}
      <span className="text-xs font-semibold tabular-nums ml-1 w-4 text-right">
        {score}
      </span>
    </div>
  );

  return (
    <details className="group rounded-md border bg-muted/30 open:bg-muted/50">
      <summary className="flex items-center gap-3 px-3 py-2 cursor-pointer list-none">
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {def?.label ?? c.criterion}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {bar(c.score_current, "current")}
          <span className="text-xs text-muted-foreground">→</span>
          {bar(c.score_improved, "improved")}
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold w-10 justify-end text-muted-foreground">
            {deltaIcon}
            {delta > 0 ? `+${delta}` : delta}
          </span>
        </div>
      </summary>
      <p className="px-10 pb-3 text-xs text-muted-foreground leading-relaxed">
        {c.comment}
      </p>
    </details>
  );
}

export function SimulationResultsPanel({
  result,
}: SimulationResultsPanelProps) {
  const currentSim = result.simulations[PROMPT_KIND.current];
  const improvedSim = result.simulations[PROMPT_KIND.improved];
  const evaluation =
    result.evaluations[PROMPT_KIND.improved] ??
    result.evaluations[PROMPT_KIND.current] ??
    null;
  const agg = evaluation ? computeJudgeAggregate(evaluation) : null;

  const currentElapsed = currentSim?.elapsedMs;
  const improvedElapsed = improvedSim?.elapsedMs;

  return (
    <section className="space-y-4">
      {/* ── ヒーローサマリ ── */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {evaluation && (
            <>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {formatWinnerLabel(evaluation.winner)}
              </Badge>
              {agg && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">
                    スコア差
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    {agg.diff > 0 ? `+${agg.diff}` : agg.diff}
                  </span>
                </div>
              )}
              {agg && (
                <span className="text-xs text-muted-foreground">
                  改善版リード {agg.improvedWinningCriteria} / 同点{" "}
                  {agg.tiedCriteria} / 現行リード {agg.currentWinningCriteria}
                </span>
              )}
            </>
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

      {/* ── 改善版 vs 元インタビュー 評価（主役） ── */}
      {result.evaluationVsOriginal &&
        (() => {
          const v = result.evaluationVsOriginal;
          const verdictLabel =
            v.overall_verdict === "improved_better"
              ? "改善版が優位"
              : v.overall_verdict === "improved_worse"
                ? "改善版が劣る"
                : "大きな差はない";
          return (
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
                {v.summary}
              </p>
              {(v.improved_strengths.length > 0 ||
                v.improved_weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {v.improved_strengths.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-green-600" />
                        改善版が元より良い点
                      </p>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {v.improved_strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {v.improved_weaknesses.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        改善版が元より劣る点
                      </p>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {v.improved_weaknesses.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {v.notable_observations.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    その他の観察
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {v.notable_observations.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}

      {/* ── 現行 sim vs 改善版 sim の比較 Judge（includeCurrent 時のみ） ── */}
      {evaluation && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              AI Judge: 現行 vs 改善版（両 sim の比較）
            </h2>
            <span className="text-xs text-muted-foreground">
              各軸をクリックで Judge コメント表示
            </span>
          </div>

          <div className="space-y-1.5">
            {evaluation.criteria.map((c) => (
              <CriterionBar key={c.criterion} c={c} />
            ))}
          </div>

          <p className="text-sm leading-relaxed bg-muted/40 rounded-md p-3">
            {evaluation.summary}
          </p>

          {(evaluation.key_differences.length > 0 ||
            evaluation.concerns.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {evaluation.key_differences.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-green-600" />
                    改善ポイント
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {evaluation.key_differences.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {evaluation.concerns.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                    投入前の懸念
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {evaluation.concerns.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                {result.persona.key_concerns.map((c) => (
                  <Badge key={c} variant="outline">
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
                {result.persona.boundaries.map((b) => (
                  <Badge key={b} variant="outline">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* ── メイン比較: 元の実インタビュー vs 改善版 sim ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">
              改善版プロンプトのシミュレート結果
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
              改善版のシミュレート結果なし
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
