"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveInterviewQuestions } from "../actions/save-interview-questions";
import type { InterviewQuestion, InterviewQuestionInput } from "../types";
import { InterviewQuestionForm } from "./interview-question-form";

interface InterviewQuestionListProps {
  interviewConfigId: string;
  questions: InterviewQuestion[];
  aiGeneratedQuestions?: InterviewQuestionInput[] | null;
  onAiQuestionsApplied?: () => void;
}

export function InterviewQuestionList({
  interviewConfigId,
  questions: initialQuestions,
  aiGeneratedQuestions,
  onAiQuestionsApplied,
}: InterviewQuestionListProps) {
  const [questions, setQuestions] = useState<InterviewQuestionInput[]>(
    initialQuestions.map((q) => ({
      question: q.question,
      instruction: q.instruction || undefined,
      quick_replies: q.quick_replies || undefined,
    }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveQuestions = useCallback(
    (questionsToSave: InterviewQuestionInput[]) => {
      startTransition(async () => {
        const result = await saveInterviewQuestions(
          interviewConfigId,
          questionsToSave
        );

        if (!result.success) {
          toast.error(result.error || "質問の保存に失敗しました");
        }
      });
    },
    [interviewConfigId]
  );

  // AI生成質問の反映
  useEffect(() => {
    if (aiGeneratedQuestions && aiGeneratedQuestions.length > 0) {
      setQuestions(aiGeneratedQuestions);
      saveQuestions(aiGeneratedQuestions);
      onAiQuestionsApplied?.();
      toast.success(`AIが${aiGeneratedQuestions.length}件の質問を生成しました`);
    }
  }, [aiGeneratedQuestions, saveQuestions, onAiQuestionsApplied]);

  const handleAdd = (newQuestion: InterviewQuestionInput) => {
    const newQuestions = [...questions, newQuestion];
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
    toast.success("質問を追加しました");
  };

  const handleUpdate = (
    index: number,
    updatedQuestion: InterviewQuestionInput
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
    setEditingIndex(null);
    saveQuestions(newQuestions);
    toast.success("質問を更新しました");
  };

  const handleDelete = (index: number) => {
    if (confirm("この質問を削除してもよろしいですか？")) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
      setEditingIndex(null);
      saveQuestions(newQuestions);
      toast.success("質問を削除しました");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">質問一覧 ({questions.length}件)</h3>
            {isPending && (
              <span className="text-sm text-gray-500">保存中...</span>
            )}
          </div>

          {questions.length === 0 ? (
            <p className="text-sm text-gray-500">
              質問が登録されていません。上記のフォームから質問を追加してください。
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                const isEditing = editingIndex === index;
                const questionKey = `question-${index}-${question.question}`;
                return (
                  <div key={questionKey}>
                    {isEditing ? (
                      <InterviewQuestionForm
                        onSubmit={(updated) => handleUpdate(index, updated)}
                        onCancel={() => setEditingIndex(null)}
                        initialData={question}
                        submitLabel="更新"
                      />
                    ) : (
                      <Card>
                        <CardContent>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
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
                                  <span className="font-medium">
                                    AIへの指示:
                                  </span>{" "}
                                  {question.instruction}
                                </div>
                              )}
                              {question.quick_replies &&
                                question.quick_replies.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      クイックリプライ:
                                    </span>{" "}
                                    {question.quick_replies.join(", ")}
                                  </div>
                                )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingIndex(index)}
                              >
                                編集
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(index)}
                              >
                                削除
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-4">質問を追加</h3>
          <InterviewQuestionForm onSubmit={handleAdd} />
        </div>
      </CardContent>
    </Card>
  );
}
