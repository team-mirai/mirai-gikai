"use client";

import {
  ChevronRight,
  HelpCircle,
  Loader2,
  Play,
  Settings2,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InterviewQuestionInput } from "@/features/interview-config/shared/types";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import type { AiModel } from "@/lib/ai/models";
import {
  fetchOriginalInterviewPreview,
  type OriginalInterviewPreview,
} from "../../server/actions/fetch-original-interview-preview";
import { SimulationResultsPanel } from "./simulation-results-panel";
import { TranscriptViewer } from "./transcript-viewer";
import {
  DEFAULT_INTERVIEWEE_MODEL,
  DEFAULT_INTERVIEWER_MODEL,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_PERSONA_MODEL,
  SIMULATION_MODEL_OPTIONS,
} from "../../shared/constants";
import type { SimulatedTurn } from "../../shared/schemas";
import type {
  CompletedReportListItem,
  SimulationProgressEvent,
  SimulationResult,
  TransientConfigSnapshot,
} from "../../shared/types";

interface ConfigSimulationPanelProps {
  /** 編集中 config の billId */
  billId: string;
  /** 保存済み config ID（保存前はタブごと非マウントにしているので必ず string） */
  configId: string;
  /** 編集フォームの現在値を取り出すための ref */
  getFormValues: () => {
    mode: string;
    themes: string[];
    knowledge_source: string;
    chat_model: string | null;
    estimated_duration: number | null;
  } | null;
  /** 質問一覧の現在値を取り出すための ref */
  getCurrentQuestions: () => InterviewQuestionInput[];
  /** 抽出元ペルソナの候補（完了済みレポート） */
  completedReports: CompletedReportListItem[];
  /** レポート一覧が上限で切り詰められたか */
  completedReportsTruncated?: boolean;
  /** 切り詰め上限値 */
  completedReportsLimit?: number;
}

const STANCE_LABEL: Record<string, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
};

function ModelSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: AiModel;
  onChange: (v: AiModel) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as AiModel)}>
        <SelectTrigger id={id} className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIMULATION_MODEL_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

async function readNdjsonStream(
  response: Response,
  onEvent: (event: SimulationProgressEvent) => void,
  signal: AbortSignal
) {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          onEvent(JSON.parse(line) as SimulationProgressEvent);
        } catch (err) {
          // 不正な JSON 行はスキップしてストリーム継続（サーバー側で println 混入等の防御）
          console.warn("[Simulation] failed to parse NDJSON line:", line, err);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function ConfigSimulationPanel({
  billId,
  configId,
  getFormValues,
  getCurrentQuestions,
  completedReports,
  completedReportsTruncated = false,
  completedReportsLimit,
}: ConfigSimulationPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [streamingTurns, setStreamingTurns] = useState<SimulatedTurn[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ペルソナソース: "report" = 完了レポートから抽出 / "bill" = 法案から自動生成
  // 完了レポートが 0 件なら自動生成をデフォルトに
  const [personaSource, setPersonaSource] = useState<"report" | "bill">(
    completedReports.length > 0 ? "report" : "bill"
  );
  // bill モード用のペルソナ生成ヒント
  const [billStanceHint, setBillStanceHint] = useState<
    "for" | "against" | "neutral" | "auto"
  >("auto");
  const [billRoleHint, setBillRoleHint] = useState<string>("");

  // 選択範囲: "config" = この設定のレポートのみ / "bill" = この法案の全レポート
  const [reportScope, setReportScope] = useState<"config" | "bill">("bill");
  const visibleReports = useMemo(
    () =>
      reportScope === "config"
        ? completedReports.filter((r) => r.configId === configId)
        : completedReports,
    [completedReports, configId, reportScope]
  );

  const [reportId, setReportId] = useState<string>(
    visibleReports[0]?.reportId ?? ""
  );

  // スコープ切替で現在の reportId が不可視になったら先頭を選び直す
  useEffect(() => {
    if (!visibleReports.some((r) => r.reportId === reportId)) {
      setReportId(visibleReports[0]?.reportId ?? "");
    }
  }, [visibleReports, reportId]);
  const [preview, setPreview] = useState<OriginalInterviewPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setPreview(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setIsPreviewLoading(true);
    setPreview(null);
    setPreviewError(null);
    (async () => {
      const res = await fetchOriginalInterviewPreview(reportId);
      if (cancelled) return;
      if (res.success) {
        setPreview(res.preview);
      } else {
        setPreviewError(res.error);
      }
      setIsPreviewLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [intervieweeModel, setIntervieweeModel] = useState<AiModel>(
    DEFAULT_INTERVIEWEE_MODEL
  );
  const [personaModel, setPersonaModel] = useState<AiModel>(
    DEFAULT_PERSONA_MODEL
  );
  const [judgeModel, setJudgeModel] = useState<AiModel>(DEFAULT_JUDGE_MODEL);
  const [includeCurrent, setIncludeCurrent] = useState(false);
  const [evaluate, setEvaluate] = useState(false);

  const selectedReport = useMemo(
    () => visibleReports.find((r) => r.reportId === reportId),
    [visibleReports, reportId]
  );

  const hasReports = visibleReports.length > 0;

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRun = useCallback(async () => {
    setError(null);
    setResult(null);
    setStreamingTurns([]);
    setStreamingStatus(null);

    if (personaSource === "report" && !reportId) {
      setError("テストに使うレポートを選択してください");
      return;
    }
    const formValues = getFormValues();
    if (!formValues) {
      setError("フォーム値の取得に失敗しました");
      return;
    }
    const currentQuestions = getCurrentQuestions();
    if (currentQuestions.length === 0) {
      setError("質問を 1 件以上登録してください");
      return;
    }

    const snapshot: TransientConfigSnapshot = {
      mode: formValues.mode === "bulk" ? "bulk" : "loop",
      themes:
        formValues.themes.length > 0
          ? formValues.themes.filter((t) => t.length > 0)
          : null,
      knowledgeSource:
        formValues.knowledge_source.trim().length > 0
          ? formValues.knowledge_source
          : null,
      estimatedDurationMinutes: formValues.estimated_duration,
      questions: currentQuestions.map((q, index) => ({
        id: `transient-${index}-${q.question.slice(0, 16)}`,
        question: q.question,
        quick_replies:
          q.quick_replies && q.quick_replies.length > 0
            ? q.quick_replies
            : null,
        follow_up_guide: q.follow_up_guide ?? null,
      })),
    };

    const resolvedInterviewerModel: AiModel =
      (formValues.chat_model as AiModel | null) ?? DEFAULT_INTERVIEWER_MODEL;

    // ペルソナソース別のリクエストペイロード
    const personaSourcePayload =
      personaSource === "report"
        ? { type: "report" as const, reportId }
        : {
            type: "bill" as const,
            billId,
            stanceHint: billStanceHint === "auto" ? undefined : billStanceHint,
            roleHint:
              billRoleHint.trim().length > 0 ? billRoleHint.trim() : undefined,
          };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch("/api/interview-simulation/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({
          personaSource: personaSourcePayload,
          improvedConfig: snapshot,
          interviewerModel: resolvedInterviewerModel,
          intervieweeModel,
          personaModel,
          judgeModel,
          // bill モードでは比較対象がないので UI 状態に関わらず無効化
          includeCurrent: personaSource === "bill" ? false : includeCurrent,
          evaluate: personaSource === "bill" ? false : evaluate,
        }),
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

      await readNdjsonStream(
        response,
        (event) => {
          switch (event.type) {
            case "status":
              setStreamingStatus(event.message);
              break;
            case "turn":
              setStreamingTurns((prev) => [...prev, event.turn]);
              break;
            case "complete":
              setResult(event.result);
              break;
            case "error":
              setError(event.message);
              break;
          }
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStreamingStatus("中断しました");
      } else {
        console.error("Simulation streaming failed:", err);
        setError(
          err instanceof Error ? err.message : "シミュレーションに失敗しました"
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [
    reportId,
    billId,
    getFormValues,
    getCurrentQuestions,
    intervieweeModel,
    personaModel,
    judgeModel,
    includeCurrent,
    evaluate,
    personaSource,
    billStanceHint,
    billRoleHint,
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-sm">シミュレーション実行</h3>
          <p className="text-xs text-muted-foreground mt-1">
            編集中の設定値（未保存含む）でインタビューを再演し、
            本番挙動を確認します。
          </p>
        </div>

        {completedReportsTruncated && (
          <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
            直近 {completedReportsLimit ?? completedReports.length}{" "}
            件を表示しています。それ以前のインタビューは一覧に含まれません。
          </div>
        )}

        {/* ペルソナソース切替 */}
        <div className="space-y-1.5">
          <Label className="text-xs">ペルソナの抽出元</Label>
          <Tabs
            value={personaSource}
            onValueChange={(v) => setPersonaSource(v as "report" | "bill")}
          >
            <TabsList className="h-8 w-full">
              <TabsTrigger
                value="report"
                className="text-xs flex-1"
                disabled={completedReports.length === 0}
              >
                完了レポートから
                {completedReports.length === 0 && "（なし）"}
              </TabsTrigger>
              <TabsTrigger value="bill" className="text-xs flex-1">
                法案から自動生成
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 自動生成モードの追加オプション */}
        {personaSource === "bill" && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              法案内容から当事者ペルソナを LLM
              で自動生成してシミュレートします。
              完了インタビューがまだない段階で設定を試すのに使います。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="sim-bill-stance" className="text-xs">
                  立場（任意）
                </Label>
                <Select
                  value={billStanceHint}
                  onValueChange={(v) =>
                    setBillStanceHint(
                      v as "for" | "against" | "neutral" | "auto"
                    )
                  }
                >
                  <SelectTrigger id="sim-bill-stance" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自動（法案から推定）</SelectItem>
                    <SelectItem value="for">賛成</SelectItem>
                    <SelectItem value="against">反対</SelectItem>
                    <SelectItem value="neutral">中立</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sim-bill-role" className="text-xs">
                  役割ヒント（任意）
                </Label>
                <input
                  id="sim-bill-role"
                  type="text"
                  value={billRoleHint}
                  onChange={(e) => setBillRoleHint(e.target.value)}
                  placeholder="例: 射場運用の民間事業者"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-0.5 text-xs shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {personaSource === "report" && completedReports.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="sim-report-select" className="text-xs">
                テストに使うレポート
              </Label>
              <Tabs
                value={reportScope}
                onValueChange={(v) => setReportScope(v as "config" | "bill")}
              >
                <TabsList className="h-7">
                  <TabsTrigger value="config" className="text-xs px-2 py-0.5">
                    この設定のみ
                  </TabsTrigger>
                  <TabsTrigger value="bill" className="text-xs px-2 py-0.5">
                    この法案全体
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {hasReports ? (
              <Select value={reportId} onValueChange={setReportId}>
                <SelectTrigger id="sim-report-select" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibleReports.map((r) => {
                    const base = `${r.roleTitle ?? "立場不明"} / ${
                      r.stance ? (STANCE_LABEL[r.stance] ?? r.stance) : "中立"
                    } — 充実度 ${r.totalContentRichness ?? "-"}`;
                    const label =
                      reportScope === "bill" && r.configName
                        ? `[${r.configName}] ${base}`
                        : base;
                    return (
                      <SelectItem key={r.reportId} value={r.reportId}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground italic border rounded-md p-2 bg-muted/30">
                この設定にはまだ完了済みのインタビューがありません。「この法案全体」に切り替えると、他の設定のインタビューから選べます。
              </div>
            )}
            {selectedReport && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline" className="font-normal text-xs">
                  {selectedReport.roleTitle ?? "-"}
                </Badge>
                <StanceBadge stance={selectedReport.stance} />
                {selectedReport.totalContentRichness !== null && (
                  <Badge variant="outline" className="font-normal text-xs">
                    充実度 {selectedReport.totalContentRichness}
                  </Badge>
                )}
              </div>
            )}

            {/* 元インタビューのプレビュー（折り畳み） */}
            {reportId && (
              <details className="group rounded-md border bg-muted/30">
                <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer list-none text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  <span className="font-medium">元インタビューを確認する</span>
                  {isPreviewLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  {preview && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {preview.conversation.length} ターン
                    </span>
                  )}
                </summary>
                <div className="px-4 pb-4 pt-1 space-y-3 text-sm">
                  {previewError && (
                    <p className="text-destructive text-xs">{previewError}</p>
                  )}
                  {preview && (
                    <>
                      {preview.summary && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            レポート要約
                          </p>
                          <p className="bg-background rounded-md border p-2 whitespace-pre-wrap">
                            {preview.summary}
                          </p>
                        </div>
                      )}
                      {preview.roleDescription && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            立場（詳細）
                          </p>
                          <p className="bg-background rounded-md border p-2 whitespace-pre-wrap">
                            {preview.roleDescription}
                          </p>
                        </div>
                      )}
                      {preview.opinions.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            opinions（{preview.opinions.length}件）
                          </p>
                          <ol className="list-decimal pl-5 space-y-1 text-xs">
                            {preview.opinions.map((o) => (
                              <li key={o.title}>
                                <span className="font-medium">{o.title}</span> —{" "}
                                <span className="text-muted-foreground">
                                  {o.content}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          会話ログ
                        </p>
                        <TranscriptViewer turns={preview.conversation} />
                      </div>
                    </>
                  )}
                  {!preview && !isPreviewLoading && !previewError && (
                    <p className="text-xs text-muted-foreground italic">
                      プレビューを読み込んでいません
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        ) : personaSource === "report" && completedReports.length === 0 ? (
          <div className="text-sm text-muted-foreground italic border rounded-md p-3 bg-muted/30">
            この法案にはまだ完了済みのインタビューがありません。「法案から自動生成」
            に切り替えるか、実インタビューを完走させてから再度お試しください。
          </div>
        ) : null}

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowModelConfig((v) => !v)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            モデル設定 {showModelConfig ? "を閉じる" : "を開く"}
          </Button>
          {showModelConfig && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                インタビュアーのモデルは「インタビュー設定」の AI
                モデルと連動します。
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ModelSelect
                  id="sim-interviewee-model"
                  label="インタビュイー"
                  value={intervieweeModel}
                  onChange={setIntervieweeModel}
                />
                <ModelSelect
                  id="sim-persona-model"
                  label="ペルソナ抽出"
                  value={personaModel}
                  onChange={setPersonaModel}
                />
                <ModelSelect
                  id="sim-judge-model"
                  label="Judge"
                  value={judgeModel}
                  onChange={setJudgeModel}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox
              id="sim-include-current"
              checked={includeCurrent && personaSource === "report"}
              onCheckedChange={(v) => setIncludeCurrent(v === true)}
              disabled={personaSource === "bill"}
            />
            <Label
              htmlFor="sim-include-current"
              className={`flex items-center gap-1 ${personaSource === "bill" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              保存済み設定とも比較する
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  編集中の設定（改善版）に加えて、保存済みの設定でも並列でシミュレーションを実行し、両者の挙動を並べて比較できます。プロンプト調整の効果を確認したいときに有効です。
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="sim-evaluate"
              checked={evaluate && personaSource === "report"}
              onCheckedChange={(v) => setEvaluate(v === true)}
              disabled={personaSource === "bill"}
            />
            <Label
              htmlFor="sim-evaluate"
              className={
                personaSource === "bill"
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }
            >
              AI Judge で元インタビューと比較評価する
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isStreaming ? (
            <Button
              type="button"
              onClick={handleStop}
              variant="destructive"
              size="lg"
            >
              <Square className="h-4 w-4" />
              中断
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleRun}
              disabled={!hasReports}
              size="lg"
            >
              <Play className="h-4 w-4" />
              この設定でシミュレート
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}
      </div>

      {/* ストリーミング中の進捗表示 */}
      {isStreaming && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm rounded-lg border bg-card px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="font-medium">
              {streamingStatus ?? "準備中..."}
            </span>
            {streamingTurns.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {streamingTurns.length} ターン
              </span>
            )}
          </div>
          <div
            className={
              personaSource === "report"
                ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
                : "grid grid-cols-1 gap-4"
            }
          >
            {personaSource === "report" && (
              <div className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">元の実インタビュー</h3>
                  {preview && (
                    <span className="text-xs text-muted-foreground">
                      {preview.conversation.length} ターン
                    </span>
                  )}
                </div>
                {preview ? (
                  <TranscriptViewer turns={preview.conversation} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    プレビューなし
                  </p>
                )}
              </div>
            )}
            <div className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">
                  {personaSource === "report"
                    ? "改善版シミュレーション"
                    : "シミュレーション"}
                </h3>
                {streamingTurns.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {streamingTurns.length} ターン
                  </span>
                )}
              </div>
              {streamingTurns.length > 0 ? (
                <TranscriptViewer turns={streamingTurns} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  待機中...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {result && <SimulationResultsPanel result={result} />}
    </div>
  );
}
