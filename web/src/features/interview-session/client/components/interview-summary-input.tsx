"use client";

import { useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { useInterviewCompletion } from "../hooks/use-interview-completion";
import { InterviewChatInput } from "./interview-chat-input";

interface InterviewSummaryInputProps {
  sessionId: string;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  isLoading: boolean;
  error: Error | null | undefined;
}

export function InterviewSummaryInput({
  sessionId,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  error,
}: InterviewSummaryInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isCompleting, completeError, handleSubmit } = useInterviewCompletion({
    sessionId,
  });

  return (
    <>
      {!isLoading && (
        <div className="mb-3 flex flex-col gap-2">
          <Button onClick={() => setIsModalOpen(true)} disabled={isCompleting}>
            {isCompleting ? "送信中..." : "レポート内容に同意して提出"}
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
      <InterviewPublicConsentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isSubmitting={isCompleting}
      />
    </>
  );
}
