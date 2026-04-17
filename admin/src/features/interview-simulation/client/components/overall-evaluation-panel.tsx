"use client";

import { AlertTriangle, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OverallEvaluation } from "../../shared/schemas";
import type { OverallStats } from "../../shared/utils/compute-overall-stats";
import type { MultiSimulationState } from "../utils/reduce-multi-simulation-state";

interface OverallEvaluationPanelProps {
  evaluationState: MultiSimulationState["overallEvaluation"];
  stats: OverallStats;
  allSlotsCount: number;
}

const VERDICT_LABEL: Record<OverallEvaluation["verdict"], string> = {
  excellent: "良好",
  good: "概ね良好",
  fair: "一部掘り残しあり",
  poor: "大きな掘り残しあり",
};

const VERDICT_CLASSES: Record<OverallEvaluation["verdict"], string> = {
  excellent: "bg-stance-for/10 text-stance-for",
  good: "bg-primary/10 text-primary",
  fair: "bg-muted text-muted-foreground",
  poor: "bg-destructive/10 text-destructive",
};

export function OverallEvaluationPanel({
  evaluationState,
  stats,
  allSlotsCount,
}: OverallEvaluationPanelProps) {
  // まだ 1 件も完了していない場合は何も表示しない
  if (stats.evaluatedCount === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">総合評価</h3>
        <Badge variant="outline" className="font-normal text-xs">
          評価対象 {stats.evaluatedCount} / {allSlotsCount} ペルソナ
        </Badge>
        {stats.averageScore !== null && (
          <Badge variant="outline" className="font-normal text-xs">
            平均 {stats.averageScore.toFixed(1)} / 5
          </Badge>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
          <CoveragePill label="網羅" count={stats.coverage.covered} />
          <CoveragePill label="一部" count={stats.coverage.partial} />
          <CoveragePill label="未達" count={stats.coverage.not_covered} />
        </div>
      </div>

      {evaluationState.status === "idle" && (
        <p className="text-xs text-muted-foreground italic">
          全ペルソナ完走後、総合評価を生成します。
        </p>
      )}

      {evaluationState.status === "running" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          インタビュー設定の総合評価を生成中...
        </div>
      )}

      {evaluationState.status === "complete" && (
        <EvaluationBody evaluation={evaluationState.evaluation} />
      )}

      {evaluationState.status === "failed" && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md p-2">
          {evaluationState.message}
        </p>
      )}
    </div>
  );
}

function CoveragePill({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5">
      {label} {count}
    </span>
  );
}

function EvaluationBody({ evaluation }: { evaluation: OverallEvaluation }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${VERDICT_CLASSES[evaluation.verdict]}`}
        >
          <Sparkles className="h-3 w-3" />
          {VERDICT_LABEL[evaluation.verdict]}
        </span>
      </div>

      <p className="text-sm leading-relaxed bg-muted/40 rounded-md p-3 whitespace-pre-wrap">
        {evaluation.summary}
      </p>

      {(evaluation.common_strengths.length > 0 ||
        evaluation.common_gaps.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluation.common_strengths.length > 0 && (
            <EvaluationList
              title="共通して引き出せた点"
              icon={<Lightbulb className="h-3.5 w-3.5 text-stance-for" />}
              items={evaluation.common_strengths}
            />
          )}
          {evaluation.common_gaps.length > 0 && (
            <EvaluationList
              title="共通して取りこぼした点"
              icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
              items={evaluation.common_gaps}
            />
          )}
        </div>
      )}

      {evaluation.improvement_suggestions.length > 0 && (
        <EvaluationList
          title="インタビュー設定への改善提案"
          icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
          items={evaluation.improvement_suggestions}
        />
      )}
    </div>
  );
}

function EvaluationList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
        {icon}
        {title}
      </p>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {items.map((item, i) => (
          <li key={`${i}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
