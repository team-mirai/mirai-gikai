"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveInterviewQuestions } from "../../server/actions/save-interview-questions";
import type {
  InterviewQuestion,
  InterviewQuestionInput,
} from "../../shared/types";
import {
  type SortableQuestion,
  toInputs,
  withUid,
} from "../utils/sortable-question";
import { InterviewQuestionForm } from "./interview-question-form";

/**
 * 並び替え可能な質問カードのラッパー。
 * 編集中（disabled=true）はドラッグハンドルを表示せず、ドラッグも無効化する。
 */
function SortableQuestionItem({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-start gap-2", isDragging && "relative z-10")}
    >
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="ドラッグして並び替え"
          className="mt-1 h-8 w-6 cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </Button>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface InterviewQuestionListProps {
  interviewConfigId: string;
  questions: InterviewQuestion[];
  aiGeneratedQuestions?: InterviewQuestionInput[] | null;
  onAiQuestionsApplied?: () => void;
  /**
   * シミュレーション機能など、親コンポーネントから現在の質問一覧を読み取るための ref。
   * 毎レンダーで最新の questions を返すゲッターに差し替わる。
   */
  getQuestionsRef?: React.MutableRefObject<
    (() => InterviewQuestionInput[]) | null
  >;
}

export function InterviewQuestionList({
  interviewConfigId,
  questions: initialQuestions,
  aiGeneratedQuestions,
  onAiQuestionsApplied,
  getQuestionsRef,
}: InterviewQuestionListProps) {
  const [questions, setQuestions] = useState<SortableQuestion[]>(() =>
    initialQuestions.map((q) =>
      withUid({
        question: q.question,
        follow_up_guide: q.follow_up_guide || undefined,
        quick_replies: q.quick_replies || undefined,
        target_audience: q.target_audience || undefined,
      })
    )
  );
  // 並び替えでインデックスがずれても編集中の行を見失わないよう _uid で管理する
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 親コンポーネントから最新の questions を読めるようにする
  useEffect(() => {
    if (!getQuestionsRef) return;
    getQuestionsRef.current = () => toInputs(questions);
    return () => {
      // アンマウント後に stale な getter を親が読まないようクリア
      getQuestionsRef.current = null;
    };
  }, [questions, getQuestionsRef]);

  // 保存はサーバー側で全件削除→再挿入するため、連続して呼ばれた場合に
  // 古いリクエストが後着して最新の並び順を上書きしないよう、送信順に直列化する。
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const saveQuestions = useCallback(
    (questionsToSave: SortableQuestion[]) => {
      const inputs = toInputs(questionsToSave);
      startTransition(async () => {
        const run = saveChainRef.current.then(async () => {
          const result = await saveInterviewQuestions(
            interviewConfigId,
            inputs
          );
          if (!result.success) {
            toast.error(result.error || "質問の保存に失敗しました");
          }
        });
        // チェーンが失敗で途切れないよう、エラーは握りつぶして次へ繋ぐ
        saveChainRef.current = run.catch(() => {});
        await saveChainRef.current;
      });
    },
    [interviewConfigId]
  );

  // AI生成質問の反映
  useEffect(() => {
    if (aiGeneratedQuestions && aiGeneratedQuestions.length > 0) {
      const newQuestions = aiGeneratedQuestions.map(withUid);
      setQuestions(newQuestions);
      saveQuestions(newQuestions);
      onAiQuestionsApplied?.();
      toast.success(`AIが${aiGeneratedQuestions.length}件の質問を生成しました`);
    }
  }, [aiGeneratedQuestions, saveQuestions, onAiQuestionsApplied]);

  const handleAdd = (newQuestion: InterviewQuestionInput) => {
    const newQuestions = [...questions, withUid(newQuestion)];
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
    toast.success("質問を追加しました");
  };

  const handleUpdate = (
    uid: string,
    updatedQuestion: InterviewQuestionInput
  ) => {
    const newQuestions = questions.map((q) =>
      q._uid === uid ? { ...updatedQuestion, _uid: uid } : q
    );
    setQuestions(newQuestions);
    setEditingUid(null);
    saveQuestions(newQuestions);
    toast.success("質問を更新しました");
  };

  const handleDelete = (uid: string) => {
    if (confirm("この質問を削除してもよろしいですか？")) {
      const newQuestions = questions.filter((q) => q._uid !== uid);
      setQuestions(newQuestions);
      if (editingUid === uid) setEditingUid(null);
      saveQuestions(newQuestions);
      toast.success("質問を削除しました");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q._uid === active.id);
    const newIndex = questions.findIndex((q) => q._uid === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newQuestions = arrayMove(questions, oldIndex, newIndex);
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
    toast.success("質問の順番を変更しました");
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q._uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const isEditing = editingUid === question._uid;
                    return (
                      <SortableQuestionItem
                        key={question._uid}
                        id={question._uid}
                        disabled={isEditing}
                      >
                        {isEditing ? (
                          <InterviewQuestionForm
                            onSubmit={(updated) =>
                              handleUpdate(question._uid, updated)
                            }
                            onCancel={() => setEditingUid(null)}
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
                                  {question.follow_up_guide && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        フォローアップ指針:
                                      </span>{" "}
                                      {question.follow_up_guide}
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
                                  {question.target_audience && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        対象者条件:
                                      </span>{" "}
                                      {question.target_audience}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingUid(question._uid)}
                                  >
                                    編集
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(question._uid)}
                                  >
                                    削除
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </SortableQuestionItem>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
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
