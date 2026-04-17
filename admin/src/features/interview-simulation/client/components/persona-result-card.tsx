"use client";

import { AlertTriangle, CheckCircle2, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import type { IntervieweeSatisfaction } from "../../shared/schemas";
import type { PersonaSlotState } from "../utils/reduce-multi-simulation-state";
import { TranscriptViewer } from "./transcript-viewer";

interface PersonaResultCardProps {
  slotState: PersonaSlotState;
}

const STATUS_LABEL: Record<PersonaSlotState["status"], string> = {
  pending: "待機中",
  running: "実行中",
  complete: "完了",
  error: "エラー",
};

/**
 * 1 ペルソナ分の結果を表示するカード。
 * ストリーミング中は暫定 transcript を、完了後は persona badge + metrics + 確定 transcript を表示。
 */
export function PersonaResultCard({ slotState }: PersonaResultCardProps) {
  const { descriptor, status, message, turns, result, error } = slotState;

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">
              ペルソナ {descriptor.personaIndex + 1}
            </span>
            <Badge variant="outline" className="font-normal text-xs">
              {descriptor.source.kind === "report"
                ? "完了レポート"
                : "自動生成"}
            </Badge>
            <StatusPill status={status} />
          </div>
          <p
            className="text-sm text-muted-foreground truncate"
            title={descriptor.label}
          >
            {descriptor.label}
          </p>
        </div>
      </div>

      {/* ペルソナ詳細（完了後のみ） */}
      {result && (
        <div className="rounded-md border bg-muted/30 p-2 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium">
              {result.persona.role_title || "立場不明"}
            </span>
            <StanceBadge stance={result.persona.stance} />
          </div>
          {result.persona.role_description && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
              {result.persona.role_description}
            </p>
          )}
          {result.persona.message_to_politicians.length > 0 && (
            <div className="pt-1 border-t">
              <p className="text-xs font-medium mb-0.5">伝えたいこと</p>
              <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                {result.persona.message_to_politicians.map((m, i) => (
                  <li key={`${i}-${m}`}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 満足度（完了後のみ） */}
      {result?.satisfaction && (
        <SatisfactionBlock satisfaction={result.satisfaction} />
      )}

      {/* メトリクス（完了後のみ） */}
      {result && (
        <div className="text-xs text-muted-foreground">
          {result.run.metrics.totalTurns} ターン /{" "}
          {(result.run.elapsedMs / 1000).toFixed(1)}秒 / カバレッジ{" "}
          {(result.run.metrics.questionCoverage * 100).toFixed(0)}% / 終了:{" "}
          {result.run.stopReason}
        </div>
      )}

      {/* 実行中の暫定メッセージ */}
      {status === "running" && message && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{message}</span>
        </div>
      )}

      {/* エラー */}
      {status === "error" && error && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="whitespace-pre-wrap">{error}</span>
        </div>
      )}

      {/* Transcript: 実行中は暫定 turns、完了後は run.transcript */}
      <TranscriptViewer
        turns={result ? result.run.transcript : turns}
        emptyMessage={
          status === "pending"
            ? "待機中..."
            : status === "running"
              ? "開始を待っています..."
              : "会話なし"
        }
      />
    </div>
  );
}

const COVERAGE_LABEL: Record<
  IntervieweeSatisfaction["message_coverage"],
  string
> = {
  covered: "ほぼ網羅",
  partial: "一部のみ",
  not_covered: "ほぼ未達",
};

function SatisfactionBlock({
  satisfaction,
}: {
  satisfaction: IntervieweeSatisfaction;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium">インタビュイー満足度</p>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < satisfaction.score;
            return (
              <Star
                // biome-ignore lint/suspicious/noArrayIndexKey: 5 fixed slots
                key={i}
                className={`h-3.5 w-3.5 ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
              />
            );
          })}
        </div>
        <Badge variant="outline" className="font-normal text-xs">
          {satisfaction.score} / 5
        </Badge>
        <Badge variant="outline" className="font-normal text-xs">
          {COVERAGE_LABEL[satisfaction.message_coverage]}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
        {satisfaction.summary}
      </p>
      {satisfaction.uncovered_points.length > 0 && (
        <div className="pt-1">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">
            伝えきれなかったポイント
          </p>
          <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
            {satisfaction.uncovered_points.map((p, i) => (
              <li key={`${i}-${p}`}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: PersonaSlotState["status"] }) {
  const classes: Record<PersonaSlotState["status"], string> = {
    pending: "bg-muted text-muted-foreground",
    running: "bg-primary/10 text-primary",
    complete: "bg-stance-for/10 text-stance-for",
    error: "bg-destructive/10 text-destructive",
  };
  const label = STATUS_LABEL[status];
  const icon =
    status === "running" ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : status === "complete" ? (
      <CheckCircle2 className="h-3 w-3" />
    ) : status === "error" ? (
      <AlertTriangle className="h-3 w-3" />
    ) : null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${classes[status]}`}
    >
      {icon}
      {label}
    </span>
  );
}
