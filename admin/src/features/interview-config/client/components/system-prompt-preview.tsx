"use client";

import { buildBulkModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/bulk-mode";
import { buildLoopModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/loop-mode";
import type {
  InterviewQuestion as PromptInterviewQuestion,
  PromptBillInput,
} from "@mirai-gikai/shared/interview-prompts/types";
import { Copy, RefreshCw } from "lucide-react";
import { type MutableRefObject, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  InterviewConfig,
  InterviewConfigFormValues,
  InterviewQuestion,
  InterviewQuestionInput,
} from "../../shared/types";

interface SystemPromptPreviewProps {
  bill: PromptBillInput;
  initialConfig: InterviewConfig | null;
  initialQuestions: InterviewQuestion[];
  getFormValuesRef: MutableRefObject<(() => InterviewConfigFormValues) | null>;
  getQuestionsRef: MutableRefObject<(() => InterviewQuestionInput[]) | null>;
}

interface BuildPromptParams {
  bill: PromptBillInput;
  mode: string;
  themes: string[];
  knowledgeSource: string;
  estimatedDuration: number | null;
  questions: PromptInterviewQuestion[];
}

function buildPrompt({
  bill,
  mode,
  themes,
  knowledgeSource,
  estimatedDuration,
  questions,
}: BuildPromptParams): string {
  const params = {
    bill,
    interviewConfig: { themes, knowledge_source: knowledgeSource },
    questions,
    currentStage: "chat" as const,
    askedQuestionIds: new Set<string>(),
    remainingMinutes: estimatedDuration ?? null,
  };
  return mode === "bulk"
    ? buildBulkModeSystemPrompt(params)
    : buildLoopModeSystemPrompt(params);
}

export function SystemPromptPreview({
  bill,
  initialConfig,
  initialQuestions,
  getFormValuesRef,
  getQuestionsRef,
}: SystemPromptPreviewProps) {
  const [prompt, setPrompt] = useState(() =>
    buildPrompt({
      bill,
      mode: initialConfig?.mode ?? "loop",
      themes: initialConfig?.themes ?? [],
      knowledgeSource: initialConfig?.knowledge_source ?? "",
      estimatedDuration: initialConfig?.estimated_duration ?? null,
      questions: initialQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        quick_replies: q.quick_replies,
        follow_up_guide: q.follow_up_guide,
      })),
    })
  );

  const refresh = () => {
    const values = getFormValuesRef.current?.();
    const questionInputs = getQuestionsRef.current?.() ?? [];
    // 編集中の質問は ID 未確定なため、プロンプト中の表示用に擬似 ID を付与する
    const questions: PromptInterviewQuestion[] = questionInputs.map((q, i) => ({
      id: `preview-${i + 1}`,
      question: q.question ?? "",
      quick_replies: q.quick_replies ?? null,
      follow_up_guide: q.follow_up_guide ?? null,
    }));
    setPrompt(
      buildPrompt({
        bill,
        mode: values?.mode ?? "loop",
        themes: values?.themes ?? [],
        knowledgeSource: values?.knowledge_source ?? "",
        estimatedDuration: values?.estimated_duration ?? null,
        questions,
      })
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("プロンプトをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>システムプロンプトプレビュー</CardTitle>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            再生成
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="mr-2 h-4 w-4" />
            コピー
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          フォームと質問の現在値からインタビュー時のシステムプロンプトを構築して表示します（chat
          ステージ・未質問状態を仮定）。フォームを編集したら「再生成」を押してください。
        </p>
        <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 border rounded p-3 max-h-[600px] overflow-auto">
          {prompt}
        </pre>
      </CardContent>
    </Card>
  );
}
