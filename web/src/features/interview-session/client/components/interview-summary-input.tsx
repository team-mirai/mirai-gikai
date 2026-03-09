"use client";

import Link from "next/link";
import { useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { useInterviewCompletion } from "../hooks/use-interview-completion";
import { InterviewChatInput } from "./interview-chat-input";

interface InterviewSummaryInputProps {
  sessionId: string;
  billId: string;
  hasReport: boolean;
  previewToken?: string;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  isLoading: boolean;
  error: Error | null | undefined;
}

export function InterviewSummaryInput({
  sessionId,
  billId,
  hasReport,
  previewToken,
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
          {hasReport ? (
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={isCompleting}
            >
              {isCompleting ? "送信中..." : "レポート内容に同意して提出"}
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={getBillDetailLink(billId, previewToken)}>
                インタビューを終了する
              </Link>
            </Button>
          )}
          {completeError && (
            <p className="text-sm text-red-500">{completeError}</p>
          )}
        </div>
      )}
      {hasReport && (
        <InterviewChatInput
          input={input}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          placeholder="レポートの修正要望があれば入力してください"
          isResponding={isLoading}
          error={error}
        />
      )}
      <InterviewPublicConsentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isSubmitting={isCompleting}
      />
    </>
  );
}
