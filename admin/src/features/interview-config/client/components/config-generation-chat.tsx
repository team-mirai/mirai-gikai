"use client";

import {
  Bot,
  Check,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InterviewQuestionInput } from "../../shared/types";
import { buildQuestionsFromTemplate } from "../../shared/utils/default-questions-template";
import { useConfigGenerationChat } from "../hooks/use-config-generation-chat";

interface ConfigGenerationChatProps {
  billId: string;
  configId?: string;
  existingThemes?: string[];
  existingQuestions?: InterviewQuestionInput[];
  onThemesConfirmed: (themes: string[]) => void;
  onQuestionsConfirmed: (questions: InterviewQuestionInput[]) => void;
}

export function ConfigGenerationChat({
  billId,
  configId,
  existingThemes,
  existingQuestions,
  onThemesConfirmed,
  onQuestionsConfirmed,
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
    stopGeneration,
    handleSubmit,
    confirmQuestions,
    confirmThemes,
    switchToQuestions,
    skipToThemes,
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

  const isQuestionStage =
    stage === "default_questions" ||
    stage === "question_proposal" ||
    stage === "question_confirmed";
  const isThemeStage =
    stage === "theme_proposal" || stage === "theme_confirmed";

  // default_questions ステージのストリーミング中は Q1/Q2 の途中出力を組み立ててプレビュー
  const streamingQuestions = useMemo<
    InterviewQuestionInput[] | undefined
  >(() => {
    if (isLoading && stage === "default_questions" && object) {
      return buildPreviewQuestions(object);
    }
    return object?.questions as InterviewQuestionInput[] | undefined;
  }, [isLoading, stage, object]);

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5" />
          AIで設定を生成
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          法案内容に合わせて質問とテーマを提案します
        </p>
        {/* ステージステッパー（クリックで切替可能） */}
        <div className="flex items-center gap-1 pt-2">
          <StageStep
            label="質問提案"
            step={1}
            active={isQuestionStage}
            completed={isThemeStage}
            onClick={isThemeStage && !isLoading ? switchToQuestions : undefined}
          />
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <StageStep
            label="テーマ提案"
            step={2}
            active={isThemeStage}
            completed={stage === "theme_confirmed"}
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
            questions={streamingQuestions}
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

      {/* 確定ボタン: 質問 */}
      {!isLoading && proposedQuestions.length > 0 && isQuestionStage && (
        <div className="px-6 py-3 border-t space-y-2">
          <p className="text-sm text-gray-600">
            提案された質問を確定してテーマ提案に進みますか？
          </p>
          <Button
            onClick={() => confirmQuestions(proposedQuestions)}
            className="w-full"
          >
            <Check className="mr-2 h-4 w-4" />
            質問を確定してテーマ提案へ
          </Button>
        </div>
      )}

      {/* 初期ブラッシュアップモード（既存config を開いた直後）でのみ、テーマへ直接スキップできる */}
      {!isLoading &&
        proposedQuestions.length === 0 &&
        stage === "question_proposal" &&
        messages.length <= 1 &&
        ((existingQuestions?.length ?? 0) > 0 ||
          (existingThemes?.length ?? 0) > 0) && (
          <div className="px-6 py-3 border-t">
            <Button variant="outline" onClick={skipToThemes} className="w-full">
              テーマ提案を実行
            </Button>
          </div>
        )}

      {/* 確定ボタン: テーマ */}
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
              テーマを確定してフォームに反映
            </Button>
          </div>
        )}

      {stage === "theme_confirmed" && (
        <div className="px-6 py-3 border-t">
          <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
            質問とテーマをフォームに反映しました。
            内容を確認・調整してください。
          </p>
        </div>
      )}

      {/* テキスト入力 / 停止ボタン */}
      <form
        onSubmit={handleFormSubmit}
        className="px-6 pb-4 pt-2 border-t flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isThemeStage
              ? "テーマへの修正要望を入力..."
              : "質問への修正要望を入力..."
          }
          disabled={isLoading}
        />
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={stopGeneration}
            aria-label="生成を停止"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </Card>
  );
}

/**
 * default_questions ステージのストリーム中オブジェクトから、
 * topics/stance の途中結果を使って 7 問のプレビューを組み立てる。
 */
function buildPreviewQuestions(
  partial: Record<string, unknown>
): InterviewQuestionInput[] | undefined {
  const topics = partial.topics as string[] | undefined;
  const stance = partial.stance as string[] | undefined;
  if (!topics && !stance) return undefined;
  return buildQuestionsFromTemplate({ topics, stance });
}

function StageStep({
  label,
  step,
  active,
  completed,
  onClick,
}: {
  label: string;
  step: number;
  active: boolean;
  completed: boolean;
  onClick?: () => void;
}) {
  const colorClass = completed
    ? "bg-green-50 text-green-700 border-green-200"
    : active
      ? "bg-primary/10 text-primary border-primary/30"
      : "bg-muted text-muted-foreground border-border";

  const content = (
    <>
      <span className="flex size-3 items-center justify-center text-[10px] font-semibold tabular-nums">
        {completed ? <Check className="size-3" /> : step}
      </span>
      <span>{label}</span>
    </>
  );

  if (onClick) {
    return (
      <Badge
        asChild
        variant="outline"
        className={`${colorClass} cursor-pointer hover:opacity-80`}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onClick}
          className="h-auto gap-1 px-2 py-0.5 text-xs font-medium"
        >
          {content}
        </Button>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={colorClass}>
      {content}
    </Badge>
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
