"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewQuestionInput,
} from "../../types";
import {
  createInterviewConfig,
  updateInterviewConfig,
} from "../../actions/upsert-interview-config";
import { saveInterviewQuestions } from "../../actions/save-interview-questions";
import { InterviewConfigForm } from "../../components/interview-config-form";
import { InterviewQuestionList } from "../../components/interview-question-list";
import { ConfigGenerationChat } from "./config-generation-chat";

interface InterviewConfigEditClientProps {
  billId: string;
  config: InterviewConfig | null;
  questions: InterviewQuestion[];
}

export function InterviewConfigEditClient({
  billId,
  config: initialConfig,
  questions,
}: InterviewConfigEditClientProps) {
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
      })
    | null
  >(null);

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
        });
        if (result.success) {
          setConfigId(result.data.id);
          toast.success("インタビュー設定を自動作成しました");
          // URLを編集ページに置き換え（ページ遷移なし）
          window.history.replaceState(
            null,
            "",
            `/bills/${billId}/interview/${result.data.id}/edit`
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
        } else {
          toast.error(result.error || "質問の保存に失敗しました");
        }
      }
    },
    [configId]
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
          />
        ) : (
          aiGeneratedQuestions &&
          aiGeneratedQuestions.length > 0 && (
            <AiQuestionsPreview questions={aiGeneratedQuestions} />
          )
        )}
      </div>

      {/* 右カラム: AIチャット */}
      <div>
        <ConfigGenerationChat
          billId={billId}
          configId={configId}
          onThemesConfirmed={handleThemesConfirmed}
          onQuestionsConfirmed={handleQuestionsConfirmed}
          getFormThemes={getFormThemes}
        />
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
                    {question.instruction && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">AIへの指示:</span>{" "}
                        {question.instruction}
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
