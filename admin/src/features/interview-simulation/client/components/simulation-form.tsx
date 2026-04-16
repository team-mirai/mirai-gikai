"use client";

import { Loader2, Play } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import type { AiModel } from "@/lib/ai/models";
import {
  type RunSimulationActionParams,
  runSimulationAction,
} from "../../server/actions/run-simulation-action";
import { SimulationResultsPanel } from "../../server/components/simulation-results-panel";
import type { BillConfigWithPrompt } from "../../server/loaders/get-bill-configs-with-prompts";
import {
  DEFAULT_INTERVIEWEE_MODEL,
  DEFAULT_INTERVIEWER_MODEL,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_PERSONA_MODEL,
  SIMULATION_MODEL_OPTIONS,
} from "../../shared/constants";
import type {
  OriginalInterviewSnapshot,
  SimulationResult,
} from "../../shared/types";

interface SimulationFormProps {
  original: OriginalInterviewSnapshot;
  /** 元レポートを作った config の ID（current 側で固定使用） */
  currentConfigId: string;
  currentConfigName: string;
  currentConfigMode: "loop" | "bulk";
  currentQuestionsCount: number;
  /** current config から構築した本番相当の system prompt */
  currentDefaultSystemPrompt: string;
  /** 同じ bill 配下の全 config（改善版の選択肢） */
  availableConfigs: BillConfigWithPrompt[];
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
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as AiModel)}>
        <SelectTrigger id={id} className="h-9">
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

export function SimulationForm({
  original,
  currentConfigId,
  currentConfigName,
  currentConfigMode,
  currentQuestionsCount,
  currentDefaultSystemPrompt,
  availableConfigs,
}: SimulationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const configById = useMemo(
    () => new Map(availableConfigs.map((c) => [c.id, c])),
    [availableConfigs]
  );

  // 現行プロンプトは編集不可（本番と同じ挙動を検証するため固定）
  const currentSystemPrompt = currentDefaultSystemPrompt;

  // 改善版 config（デフォルト: current と同じ）
  const [improvedConfigId, setImprovedConfigId] = useState(currentConfigId);
  const [improvedSystemPrompt, setImprovedSystemPrompt] = useState(
    currentDefaultSystemPrompt
  );

  const improvedConfig = configById.get(improvedConfigId);

  const handleImprovedConfigChange = (newConfigId: string) => {
    const next = configById.get(newConfigId);
    if (!next) return;
    setImprovedConfigId(newConfigId);
    // 編集中の改善版プロンプトを選択 config のデフォルトで上書き
    setImprovedSystemPrompt(next.defaultSystemPrompt);
  };

  const [interviewerModel, setInterviewerModel] = useState<AiModel>(
    DEFAULT_INTERVIEWER_MODEL
  );
  const [intervieweeModel, setIntervieweeModel] = useState<AiModel>(
    DEFAULT_INTERVIEWEE_MODEL
  );
  const [personaModel, setPersonaModel] = useState<AiModel>(
    DEFAULT_PERSONA_MODEL
  );
  const [judgeModel, setJudgeModel] = useState<AiModel>(DEFAULT_JUDGE_MODEL);
  const [includeCurrent, setIncludeCurrent] = useState(false);
  const [evaluate, setEvaluate] = useState(true);

  const handleSubmit = () => {
    setError(null);
    setResult(null);
    const params: RunSimulationActionParams = {
      reportId: original.reportId,
      currentSystemPrompt,
      improvedSystemPrompt,
      improvedConfigId,
      improvedQuestionsCount: improvedConfig?.questionsCount ?? 0,
      interviewerModel,
      intervieweeModel,
      personaModel,
      judgeModel,
      includeCurrent,
      evaluate,
    };
    startTransition(async () => {
      try {
        const res = await runSimulationAction(params);
        if (res.success) {
          setResult(res.result);
        } else {
          setError(res.error);
        }
      } catch (err) {
        console.error("Simulation failed:", err);
        setError(
          err instanceof Error ? err.message : "シミュレーションに失敗しました"
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-card">
        <h2 className="text-lg font-semibold mb-3">元レポート</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">立場</dt>
            <dd>{original.roleTitle ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">スタンス</dt>
            <dd>
              <StanceBadge stance={original.stance} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">情報量</dt>
            <dd>{original.totalContentRichness ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">評価</dt>
            <dd>{original.rating ?? "-"}</dd>
          </div>
          <div className="col-span-2 md:col-span-4">
            <dt className="text-muted-foreground text-xs">サマリ</dt>
            <dd className="whitespace-pre-wrap">{original.summary ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border p-4 bg-card space-y-4">
        <h2 className="text-lg font-semibold">プロンプト</h2>
        <p className="text-xs text-muted-foreground">
          現行は元レポートの config ({currentConfigName} / mode:{" "}
          {currentConfigMode} / 質問 {currentQuestionsCount}問)
          から構築した本番相当の system prompt をそのまま使います。
        </p>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <Label htmlFor="improved-prompt" className="text-sm font-medium">
              改善版プロンプト（こちらを編集）
            </Label>
            {improvedConfig && (
              <span className="text-xs text-muted-foreground">
                config: {improvedConfig.name}（mode: {improvedConfig.mode} /
                質問 {improvedConfig.questionsCount}問）
                {improvedConfigId !== currentConfigId && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    config 変更中
                  </Badge>
                )}
              </span>
            )}
          </div>

          <div className="mb-2 flex items-center gap-2">
            <Label
              htmlFor="improved-config"
              className="text-xs text-muted-foreground shrink-0"
            >
              改善版で使う config:
            </Label>
            <Select
              value={improvedConfigId}
              onValueChange={handleImprovedConfigChange}
            >
              <SelectTrigger id="improved-config" className="h-8 max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableConfigs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}（mode: {c.mode} / 質問 {c.questionsCount}問）
                    {c.id === currentConfigId ? " — 現行" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground mb-1.5">
            config を切り替えるとプロンプトは新 config
            のデフォルトで上書きされます（編集中の内容は破棄）。
            プロンプト本文は自由に編集可能です。
          </p>
          <Textarea
            id="improved-prompt"
            value={improvedSystemPrompt}
            onChange={(e) => setImprovedSystemPrompt(e.target.value)}
            rows={14}
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-card space-y-4">
        <h2 className="text-lg font-semibold">実行設定</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ModelSelect
            id="interviewer-model"
            label="インタビュアーモデル"
            value={interviewerModel}
            onChange={setInterviewerModel}
          />
          <ModelSelect
            id="interviewee-model"
            label="インタビュイーモデル"
            value={intervieweeModel}
            onChange={setIntervieweeModel}
          />
          <ModelSelect
            id="persona-model"
            label="ペルソナ抽出モデル"
            value={personaModel}
            onChange={setPersonaModel}
          />
          <ModelSelect
            id="judge-model"
            label="Judge モデル"
            value={judgeModel}
            onChange={setJudgeModel}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id="include-current"
              checked={includeCurrent}
              onCheckedChange={(v) => setIncludeCurrent(v === true)}
            />
            <Label htmlFor="include-current" className="cursor-pointer">
              現行プロンプトも並列実行（比較する）
            </Label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id="evaluate"
              checked={evaluate}
              onCheckedChange={(v) => setEvaluate(v === true)}
            />
            <Label htmlFor="evaluate" className="cursor-pointer">
              AI Judge による比較評価を実行
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending} size="lg">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPending ? "シミュレーション実行中..." : "シミュレーションを実行"}
          </Button>
          {isPending && (
            <span className="text-xs text-muted-foreground">
              改善版のみ: 通常 60〜90 秒 / 現行並列 + Judge: 90〜120 秒
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}
      </div>

      {result && <SimulationResultsPanel result={result} />}
    </div>
  );
}
