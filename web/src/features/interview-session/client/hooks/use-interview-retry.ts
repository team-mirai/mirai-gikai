import { useRef, useState } from "react";
import type { InterviewChatRequestParams } from "@/features/interview-session/shared/types";
import { logger } from "@/lib/logger";

const MAX_AUTO_RETRIES = 1;

export function useInterviewRetry() {
  const retryCount = useRef(0);
  const [displayError, setDisplayError] = useState<Error | null>(null);
  const lastFailedRequestParams = useRef<InterviewChatRequestParams | null>(
    null
  );

  /**
   * リクエストパラメータを保存（リトライ用）
   */
  const saveRequestParams = (params: InterviewChatRequestParams) => {
    lastFailedRequestParams.current = params;
  };

  /**
   * エラー発生時の処理（自動リトライ判定）
   * @returns true: 自動リトライ実行, false: 手動リトライ待ち
   */
  const handleError = (
    error: Error,
    submit: (params: InterviewChatRequestParams) => void
  ): boolean => {
    console.error("chat error", error);
    logger.debug(retryCount.current, lastFailedRequestParams.current);

    // 自動リトライ判定（1回まで）
    if (
      retryCount.current < MAX_AUTO_RETRIES &&
      lastFailedRequestParams.current
    ) {
      logger.debug(
        `[Auto Retry] Attempt ${retryCount.current + 1}/${MAX_AUTO_RETRIES}`
      );
      retryCount.current += 1;

      // リトライフラグを付けて自動再送信
      submit({
        ...lastFailedRequestParams.current,
        isRetry: true,
      });
      return true; // 自動リトライ実行
    }

    // 自動リトライ上限に達した場合は手動リトライ待ち
    // エラーを表示用stateに保存
    setDisplayError(
      new Error("エラーが発生しました。もう一度お試しください。")
    );
    return false; // 手動リトライ待ち
  };

  /**
   * 成功時のリセット
   */
  const resetRetry = () => {
    retryCount.current = 0;
    setDisplayError(null);
    lastFailedRequestParams.current = null;
  };

  /**
   * 手動リトライの実行
   * 保存されているリクエストパラメータを使って再送信
   */
  const manualRetry = (
    submit: (params: InterviewChatRequestParams) => void
  ) => {
    if (!lastFailedRequestParams.current) return;

    retryCount.current = 0;
    setDisplayError(null);

    // 保存されたパラメータにisRetryフラグを追加して再送信
    const params = { ...lastFailedRequestParams.current, isRetry: true };
    submit(params);
  };

  return {
    // State
    displayError,
    canRetry: !!lastFailedRequestParams.current,

    // Actions
    saveRequestParams,
    handleError,
    resetRetry,
    manualRetry,
  };
}
