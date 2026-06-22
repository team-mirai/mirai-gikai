"use client";

import { useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { useEndInterview } from "../hooks/use-end-interview";
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
  /** レポート未生成時の「インタビューを続ける」で呼ぶ再開処理 */
  onResume?: () => void;
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
  onResume,
  isLoading,
  error,
}: InterviewSummaryInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isCompleting, completeError, handleSubmit } = useInterviewCompletion({
    sessionId,
  });
  const { endInterview, isEnding } = useEndInterview(
    sessionId,
    billId,
    previewToken
  );

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
            <>
              <p className="text-sm font-medium leading-[1.8] text-mirai-text mb-2">
                お話しいただいた内容が短く、レポートを作成できませんでした。もう少しインタビューを続けると、レポートを作成できます。
              </p>
              <Button onClick={() => onResume?.()}>インタビューを続ける</Button>
              <Button
                variant="outline"
                onClick={endInterview}
                disabled={isEnding}
              >
                {isEnding ? "終了中..." : "インタビューを終了する"}
              </Button>
            </>
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
          placeholder="レポートの修正要望を入力する"
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
