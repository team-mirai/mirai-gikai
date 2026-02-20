"use client";

import { Bot, Check, Loader2, Send, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InterviewQuestionInput } from "../../shared/types";
import { useConfigGenerationChat } from "../hooks/use-config-generation-chat";

interface ConfigGenerationChatProps {
  billId: string;
  configId?: string;
  existingThemes?: string[];
  existingQuestions?: InterviewQuestionInput[];
  onThemesConfirmed: (themes: string[]) => void;
  onQuestionsConfirmed: (questions: InterviewQuestionInput[]) => void;
  getFormThemes?: () => string[];
}

export function ConfigGenerationChat({
  billId,
  configId,
  existingThemes,
  existingQuestions,
  onThemesConfirmed,
  onQuestionsConfirmed,
  getFormThemes,
}: ConfigGenerationChatProps) {
  const {
    input,
    setInput,
    stage,
    messages,
    isLoading,
    error,
    object,
    proposedThemes,
    proposedQuestions,
    startGeneration,
    handleSubmit,
    confirmThemes,
    confirmQuestions,
    skipToQuestions,
    switchToThemes,
  } = useConfigGenerationChat({
    billId,
    configId,
    existingThemes,
    existingQuestions,
    onThemesConfirmed,
    onQuestionsConfirmed,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  // マウント時にAI生成を自動実行
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startGeneration();
    }
  }, [startGeneration]);

  // 新しいメッセージでチャットコンテナ内のみ自動スクロール
  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesとobjectの変化でスクロールをトリガーする
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, object?.text]);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSubmit(input);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5" />
          AIで設定を生成
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          法案内容に基づいてテーマと質問を提案します
        </p>
        {/* ステージ表示（クリックで切替可能） */}
        <div className="flex gap-2 pt-1">
          <StageBadge
            label="テーマ提案"
            active={stage === "theme_proposal"}
            completed={
              stage === "theme_confirmed" ||
              stage === "question_proposal" ||
              stage === "question_confirmed"
            }
            onClick={
              stage !== "theme_proposal" && stage !== "question_confirmed"
                ? switchToThemes
                : undefined
            }
          />
          <StageBadge
            label="質問提案"
            active={stage === "question_proposal"}
            completed={stage === "question_confirmed"}
            onClick={
              stage === "theme_proposal"
                ? () => skipToQuestions(getFormThemes?.() ?? [])
                : undefined
            }
          />
        </div>
      </CardHeader>

      <CardContent
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pb-2"
      >
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "assistant" ? (
              <AssistantMessage
                content={message.content}
                themes={message.themes}
                questions={message.questions}
              />
            ) : (
              <UserMessage content={message.content} />
            )}
          </div>
        ))}

        {/* ストリーミング中のコンテンツ */}
        {isLoading && object && (
          <AssistantMessage
            content={object.text || ""}
            themes={object.themes as string[] | undefined}
            questions={object.questions as InterviewQuestionInput[] | undefined}
            isStreaming
          />
        )}

        {isLoading && !object && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            AIが考え中...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            エラーが発生しました。もう一度お試しください。
          </div>
        )}
      </CardContent>

      {/* 確定ボタン */}
      {!isLoading &&
        proposedThemes.length > 0 &&
        stage === "theme_proposal" && (
          <div className="px-6 py-3 border-t">
            <p className="text-sm text-gray-600 mb-2">
              提案されたテーマを確定しますか？
            </p>
            <Button
              onClick={() => confirmThemes(proposedThemes)}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              テーマを確定して質問生成へ
            </Button>
          </div>
        )}

      {!isLoading &&
        proposedQuestions.length > 0 &&
        stage === "question_proposal" && (
          <div className="px-6 py-3 border-t">
            <p className="text-sm text-gray-600 mb-2">
              提案された質問を確定しますか？
            </p>
            <Button
              onClick={() => confirmQuestions(proposedQuestions)}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              質問を確定してフォームに反映
            </Button>
          </div>
        )}

      {stage === "question_confirmed" && (
        <div className="px-6 py-3 border-t">
          <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
            テーマと質問をフォームに反映しました。
            内容を確認・調整してください。
          </p>
        </div>
      )}

      {/* テキスト入力 */}
      {stage !== "question_confirmed" && (
        <form
          onSubmit={handleFormSubmit}
          className="px-6 pb-4 pt-2 border-t flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="修正の要望を入力..."
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </Card>
  );
}

function StageBadge({
  label,
  active,
  completed,
  onClick,
}: {
  label: string;
  active: boolean;
  completed: boolean;
  onClick?: () => void;
}) {
  const baseClass = `text-xs px-2 py-1 rounded-full inline-flex items-center ${
    completed
      ? "bg-green-100 text-green-800"
      : active
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-500"
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        className={`${baseClass} cursor-pointer hover:opacity-80`}
        onClick={onClick}
      >
        {completed && <Check className="h-3 w-3 mr-1" />}
        {label}
      </button>
    );
  }

  return (
    <span className={baseClass}>
      {completed && <Check className="h-3 w-3 mr-1" />}
      {label}
    </span>
  );
}

function AssistantMessage({
  content,
  themes,
  questions,
  isStreaming,
}: {
  content: string;
  themes?: string[];
  questions?: InterviewQuestionInput[];
  isStreaming?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
      <div className="space-y-2 flex-1 min-w-0">
        {content && <p className="text-sm whitespace-pre-wrap">{content}</p>}
        {themes && themes.length > 0 && (
          <Card>
            <CardContent className="py-2">
              <p className="text-xs font-medium text-gray-500 mb-1">
                提案テーマ:
              </p>
              <ul className="text-sm space-y-1">
                {themes.map((theme, i) => (
                  <li key={`theme-${i}-${theme?.slice(0, 10) ?? ""}`}>
                    ・{theme}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {questions && questions.length > 0 && (
          <Card>
            <CardContent className="py-2">
              <p className="text-xs font-medium text-gray-500 mb-1">
                提案質問:
              </p>
              <div className="text-sm space-y-2">
                {questions.map((q, i) => (
                  <div key={`q-${i}-${q.question?.slice(0, 10) ?? ""}`}>
                    <p className="font-medium">
                      Q{i + 1}: {q.question}
                    </p>
                    {q.follow_up_guide && (
                      <p className="text-xs text-gray-500 ml-4">
                        フォローアップ指針: {q.follow_up_guide}
                      </p>
                    )}
                    {q.quick_replies && q.quick_replies.length > 0 && (
                      <p className="text-xs text-gray-500 ml-4">
                        選択肢: {q.quick_replies.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {isStreaming && (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="bg-blue-50 rounded-lg px-3 py-2 max-w-[80%]">
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
}
