"use client";

import {
  type InterviewMode,
  INTERVIEW_MODES,
} from "@mirai-gikai/shared/interview-prompts/types";
import { Loader2, Play, Settings2, Square } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InterviewQuestionInput } from "@/features/interview-config/shared/types";
import type { AiModel } from "@/lib/ai/models";
import {
  DEFAULT_INTERVIEWEE_MODEL,
  DEFAULT_INTERVIEWER_MODEL,
  DEFAULT_PERSONA_MODEL,
  SIMULATION_MODEL_OPTIONS,
} from "../../shared/constants";
import type {
  CompletedReportListItem,
  MultiSimulationRunRequest,
  PersonaSlotInput,
  TransientConfigSnapshot,
} from "../../shared/types";
import { computeOverallStats } from "../../shared/utils/compute-overall-stats";
import { validatePersonaSlots } from "../../shared/utils/validate-persona-slots";
import { useMultiSimulationRun } from "../hooks/use-multi-simulation-run";
import { OverallEvaluationPanel } from "./overall-evaluation-panel";
import { PersonaResultCard } from "./persona-result-card";
import { PersonaSelectorList } from "./persona-selector-list";

interface MultiSimulationViewProps {
  billId: string;
  configId: string;
  /** 編集フォームの現在値を取り出す（未保存編集値を含む） */
  getFormValues: () => {
    mode: string;
    themes: string[];
    chat_model: string | null;
    estimated_duration: number | null;
  } | null;
  getCurrentQuestions: () => InterviewQuestionInput[];
  completedReports: CompletedReportListItem[];
  completedReportsTruncated?: boolean;
  completedReportsLimit?: number;
}

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

export function MultiSimulationView({
  billId,
  configId,
  getFormValues,
  getCurrentQuestions,
  completedReports,
  completedReportsTruncated = false,
  completedReportsLimit,
}: MultiSimulationViewProps) {
  const [slots, setSlots] = useState<PersonaSlotInput[]>([]);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [intervieweeModel, setIntervieweeModel] = useState<AiModel>(
    DEFAULT_INTERVIEWEE_MODEL
  );
  const [personaModel, setPersonaModel] = useState<AiModel>(
    DEFAULT_PERSONA_MODEL
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const { state, isRunning, error, run, stop } = useMultiSimulationRun();

  const handleRun = useCallback(async () => {
    setValidationError(null);

    const validation = validatePersonaSlots(slots);
    if (!validation.ok) {
      setValidationError(validation.error);
      return;
    }

    const formValues = getFormValues();
    if (!formValues) {
      setValidationError("フォーム値の取得に失敗しました");
      return;
    }
    const currentQuestions = getCurrentQuestions();
    if (currentQuestions.length === 0) {
      setValidationError("質問を 1 件以上登録してください");
      return;
    }

    const snapshot: TransientConfigSnapshot = {
      mode: (INTERVIEW_MODES as readonly string[]).includes(formValues.mode)
        ? (formValues.mode as InterviewMode)
        : "loop",
      themes:
        formValues.themes.length > 0
          ? formValues.themes.filter((t) => t.length > 0)
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
        target_audience: q.target_audience ?? null,
      })),
    };

    // chat_model は任意文字列なので AI_MODELS に含まれているか検証してから採用。
    // 未マッチならデフォルトにフォールバック（そのまま送るとサーバ側 400 で不親切）
    const allowedModels = new Set<string>(
      SIMULATION_MODEL_OPTIONS.map((opt) => opt.value)
    );
    const candidateInterviewerModel = formValues.chat_model ?? "";
    const resolvedInterviewerModel: AiModel = allowedModels.has(
      candidateInterviewerModel
    )
      ? (candidateInterviewerModel as AiModel)
      : DEFAULT_INTERVIEWER_MODEL;

    const body: MultiSimulationRunRequest = {
      billId,
      personaSlots: slots,
      improvedConfig: snapshot,
      interviewerModel: resolvedInterviewerModel,
      intervieweeModel,
      personaModel,
    };

    await run(body);
  }, [
    billId,
    slots,
    getFormValues,
    getCurrentQuestions,
    intervieweeModel,
    personaModel,
    run,
  ]);

  const completedCount =
    state.slots?.filter((s) => s.status === "complete").length ?? 0;
  const runningCount =
    state.slots?.filter((s) => s.status === "running").length ?? 0;
  const errorCount =
    state.slots?.filter((s) => s.status === "error").length ?? 0;

  // 集計統計（完了したスロットの満足度から即時計算）
  const overallStats = useMemo(
    () =>
      computeOverallStats(
        (state.slots ?? []).map((s) => s.result?.satisfaction ?? null)
      ),
    [state.slots]
  );

  return (
    <div className="space-y-4">
      {/* 実行設定カード */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-sm">複数ペルソナでシミュレート</h3>
          <p className="text-xs text-muted-foreground mt-1">
            編集中の設定値（未保存含む）で、複数のペルソナに対して同時にインタビューを再演します。
          </p>
        </div>

        <PersonaSelectorList
          slots={slots}
          onChange={setSlots}
          billId={billId}
          currentConfigId={configId}
          completedReports={completedReports}
          completedReportsTruncated={completedReportsTruncated}
          completedReportsLimit={completedReportsLimit}
          disabled={isRunning}
        />

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
                  id="multi-sim-interviewee-model"
                  label="インタビュイー"
                  value={intervieweeModel}
                  onChange={setIntervieweeModel}
                />
                <ModelSelect
                  id="multi-sim-persona-model"
                  label="ペルソナ抽出"
                  value={personaModel}
                  onChange={setPersonaModel}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <Button
              type="button"
              onClick={stop}
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
              disabled={slots.length === 0}
              size="lg"
            >
              <Play className="h-4 w-4" />
              シミュレート開始（{slots.length}ペルソナ）
            </Button>
          )}
          {isRunning && state.slots && (
            <div className="text-xs text-muted-foreground">
              完了 {completedCount} / 実行中 {runningCount}
              {errorCount > 0 && ` / エラー ${errorCount}`} /{" "}
              {state.slots.length} ペルソナ
            </div>
          )}
        </div>

        {validationError && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {validationError}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        {state.globalStatus && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {state.globalStatus}
          </div>
        )}
      </div>

      {/* 総合評価: 全スロット完走後の LLM 要約 + 即時集計 */}
      {state.slots && state.slots.length > 0 && (
        <OverallEvaluationPanel
          evaluationState={state.overallEvaluation}
          stats={overallStats}
          allSlotsCount={state.slots.length}
        />
      )}

      {/* 結果: 横一列で並べ、幅が足りなければ横スクロール。
          各カードに最小幅を与えてペルソナ毎の内容が潰れないようにする。 */}
      {state.slots && state.slots.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 items-stretch snap-x snap-mandatory pb-2">
            {state.slots.map((slotState) => (
              <div
                key={slotState.descriptor.personaIndex}
                className="flex-none w-[360px] md:w-[420px] snap-start"
              >
                <PersonaResultCard slotState={slotState} />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.totalElapsedMs !== null && state.slots && (
        <div className="text-xs text-muted-foreground text-right">
          全体経過時間: {(state.totalElapsedMs / 1000).toFixed(1)} 秒
        </div>
      )}
    </div>
  );
}
