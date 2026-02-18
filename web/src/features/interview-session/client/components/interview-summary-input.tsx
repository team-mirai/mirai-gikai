"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { useInterviewCompletion } from "../hooks/use-interview-completion";
import { InterviewChatInput } from "./interview-chat-input";

interface InterviewSummaryInputProps {
  sessionId: string;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  onComplete: (reportId: string | null) => void;
  isLoading: boolean;
  error: Error | null | undefined;
}

export function InterviewSummaryInput({
  sessionId,
  input,
  onInputChange,
  onSubmit,
  onComplete,
  isLoading,
  error,
}: InterviewSummaryInputProps) {
  const { isCompleting, completeError, handleAgree } = useInterviewCompletion({
    sessionId,
    onComplete,
  });

  return (
    <>
      {!isLoading && (
        <div className="mb-3 flex flex-col gap-2">
          <Button onClick={handleAgree} disabled={isCompleting}>
            {isCompleting ? "送信中..." : "レポート内容に同意する"}
          </Button>
          {completeError && (
            <p className="text-sm text-red-500">{completeError}</p>
          )}
        </div>
      )}
      <InterviewChatInput
        input={input}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        placeholder="レポートの修正要望があれば入力してください"
        isResponding={isLoading}
        error={error}
      />
    </>
  );
}
