"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigSimulationPanel } from "@/features/interview-simulation/client/components/config-simulation-panel";
import type { CompletedReportListItem } from "@/features/interview-simulation/shared/types";
import { routes } from "@/lib/routes";
import { saveInterviewQuestions } from "../../server/actions/save-interview-questions";
import {
  createInterviewConfig,
  updateInterviewConfig,
} from "../../server/actions/upsert-interview-config";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewQuestionInput,
} from "../../shared/types";
import { ConfigGenerationChat } from "./config-generation-chat";
import { InterviewConfigForm } from "./interview-config-form";
import { InterviewQuestionList } from "./interview-question-list";

interface InterviewConfigEditClientProps {
  billId: string;
  config: InterviewConfig | null;
  questions: InterviewQuestion[];
  completedReports: CompletedReportListItem[];
  /** レポート一覧が上限で切り詰められたか（シミュレーション UI の警告表示用） */
  completedReportsTruncated?: boolean;
  /** 切り詰め上限値 */
  completedReportsLimit?: number;
}

export function InterviewConfigEditClient({
  billId,
  config: initialConfig,
  questions,
  completedReports,
  completedReportsTruncated = false,
  completedReportsLimit,
}: InterviewConfigEditClientProps) {
  const router = useRouter();
  const [configId, setConfigId] = useState<string | undefined>(
    initialConfig?.id
  );
  const [aiGeneratedThemes, setAiGeneratedThemes] = useState<string[] | null>(
    null
  );
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<
    InterviewQuestionInput[] | null
  >(null);

  // フォームの値を取得するためのref
  const getFormValuesRef = useRef<
    | (() => {
        name: string;
        knowledge_source: string;
        mode: string;
        themes: string[];
        chat_model: string | null;
        estimated_duration: number | null;
      })
    | null
  >(null);
  // 質問一覧の現在値を取得するための ref（シミュレーション機能で使用）
  const getQuestionsRef = useRef<(() => InterviewQuestionInput[]) | null>(null);

  const getFormThemes = useCallback(
    () => getFormValuesRef.current?.().themes ?? [],
    []
  );

  // テーマ確定時: configがなければ自動作成、あれば更新
  const handleThemesConfirmed = useCallback(
    async (themes: string[]) => {
      setAiGeneratedThemes(themes);

      if (!configId) {
        // 新規: configを自動作成
        const formValues = getFormValuesRef.current?.();
        const result = await createInterviewConfig(billId, {
          name: formValues?.name || "AI生成設定",
          status: "closed",
          mode: (formValues?.mode as "loop" | "bulk") || "loop",
          themes,
          knowledge_source: formValues?.knowledge_source || "",
          chat_model: formValues?.chat_model || null,
          estimated_duration: formValues?.estimated_duration ?? null,
        });
        if (result.success) {
          setConfigId(result.data.id);
          toast.success("インタビュー設定を自動作成しました");
          // URLを編集ページに置き換え（ページ遷移なし）
          window.history.replaceState(
            null,
            "",
            routes.billInterviewEdit(billId, result.data.id)
          );
        } else {
          toast.error(result.error || "設定の作成に失敗しました");
        }
      } else {
        // 既存: テーマを更新
        const formValues = getFormValuesRef.current?.();
        await updateInterviewConfig(configId, {
          name: formValues?.name || initialConfig?.name || "",
          status: initialConfig?.status || "closed",
          mode:
            (formValues?.mode as "loop" | "bulk") ||
            initialConfig?.mode ||
            "loop",
          themes,
          knowledge_source:
            formValues?.knowledge_source ||
            initialConfig?.knowledge_source ||
            "",
          chat_model:
            formValues?.chat_model ?? initialConfig?.chat_model ?? null,
          estimated_duration:
            formValues?.estimated_duration ??
            initialConfig?.estimated_duration ??
            null,
        });
      }
    },
    [billId, configId, initialConfig]
  );

  // 質問確定時: configがあれば直接保存
  const handleQuestionsConfirmed = useCallback(
    async (confirmedQuestions: InterviewQuestionInput[]) => {
      setAiGeneratedQuestions(confirmedQuestions);

      if (configId) {
        const result = await saveInterviewQuestions(
          configId,
          confirmedQuestions
        );
        if (result.success) {
          toast.success(`${confirmedQuestions.length}件の質問を保存しました`);
          router.refresh();
        } else {
          toast.error(result.error || "質問の保存に失敗しました");
        }
      }
    },
    [configId, router]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左カラム: フォーム */}
      <div className="space-y-6">
        <InterviewConfigForm
          billId={billId}
          config={initialConfig}
          aiGeneratedThemes={aiGeneratedThemes}
          onAiThemesApplied={() => setAiGeneratedThemes(null)}
          getFormValuesRef={getFormValuesRef}
        />
        {configId ? (
          <InterviewQuestionList
            interviewConfigId={configId}
            questions={questions}
            aiGeneratedQuestions={aiGeneratedQuestions}
            onAiQuestionsApplied={() => setAiGeneratedQuestions(null)}
            getQuestionsRef={getQuestionsRef}
          />
        ) : (
          aiGeneratedQuestions &&
          aiGeneratedQuestions.length > 0 && (
            <AiQuestionsPreview questions={aiGeneratedQuestions} />
          )
        )}
      </div>

      {/* 右カラム: シミュレーション / AI 設定生成 をタブで切替
          タブ切替で state が失われないよう forceMount で両方マウント維持、
          非アクティブタブは data-state ベースで非表示にする */}
      <div>
        <Tabs defaultValue="ai-chat" className="w-full">
          <TabsList>
            <TabsTrigger value="ai-chat">AI 設定生成</TabsTrigger>
            <TabsTrigger value="simulation" disabled={!configId}>
              シミュレーション
              {!configId && "（保存後に有効）"}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="ai-chat"
            forceMount
            className="mt-4 data-[state=inactive]:hidden"
          >
            <ConfigGenerationChat
              billId={billId}
              configId={configId}
              existingThemes={initialConfig?.themes ?? undefined}
              existingQuestions={questions.map((q) => ({
                question: q.question,
                follow_up_guide: q.follow_up_guide ?? undefined,
                quick_replies: q.quick_replies ?? undefined,
              }))}
              onThemesConfirmed={handleThemesConfirmed}
              onQuestionsConfirmed={handleQuestionsConfirmed}
              getFormThemes={getFormThemes}
            />
          </TabsContent>
          {configId ? (
            <TabsContent
              value="simulation"
              forceMount
              className="mt-4 data-[state=inactive]:hidden"
            >
              <ConfigSimulationPanel
                billId={billId}
                configId={configId}
                getFormValues={() => getFormValuesRef.current?.() ?? null}
                getCurrentQuestions={() => getQuestionsRef.current?.() ?? []}
                completedReports={completedReports}
                completedReportsTruncated={completedReportsTruncated}
                completedReportsLimit={completedReportsLimit}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}

/** 新規作成時のAI生成質問プレビュー */
function AiQuestionsPreview({
  questions,
}: {
  questions: InterviewQuestionInput[];
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              AI生成質問プレビュー ({questions.length}件)
            </h3>
          </div>
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded mb-4">
            設定を保存すると、以下の質問が登録されます。
          </p>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card
                key={`preview-${index}-${question.question?.slice(0, 10) ?? ""}`}
              >
                <CardContent className="py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Q{index + 1}
                      </span>
                      <div className="font-semibold text-gray-900">
                        {question.question}
                      </div>
                    </div>
                    {question.follow_up_guide && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">フォローアップ指針:</span>{" "}
                        {question.follow_up_guide}
                      </div>
                    )}
                    {question.quick_replies &&
                      question.quick_replies.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">クイックリプライ:</span>{" "}
                          {question.quick_replies.join(", ")}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
