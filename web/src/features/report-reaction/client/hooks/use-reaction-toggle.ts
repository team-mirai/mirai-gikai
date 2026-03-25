"use client";

import { useEffect, useRef, useState } from "react";
import { toggleReaction } from "../../server/actions/toggle-reaction";
import type { ReactionType, ReportReactionData } from "../../shared/types";
import { computeOptimisticState } from "../../shared/utils/compute-optimistic-state";

/**
 * リアクションの楽観的更新とサーバー同期を管理するカスタムhook
 *
 * - クリック時に即座にUIを更新（楽観的更新）
 * - サーバーアクション成功時はnewReactionで確定
 * - サーバーアクション失敗時はロールバック（props同期が割り込んだ場合はスキップ）
 * - 親から渡されるinitialDataが変わった場合（フィルタ切替等）は同期
 */
export function useReactionToggle(
  reportId: string,
  initialData: ReportReactionData
) {
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  const prevInitialDataRef = useRef(initialData);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (prevInitialDataRef.current !== initialData) {
      prevInitialDataRef.current = initialData;
      requestIdRef.current += 1;
      setData(initialData);
    }
  }, [initialData]);

  const toggle = async (reactionType: ReactionType) => {
    if (isPending) return;

    const currentRequestId = ++requestIdRef.current;
    const previousData = data;
    setData(computeOptimisticState(data, reactionType));
    setIsPending(true);

    try {
      const result = await toggleReaction(reportId, reactionType);
      if (currentRequestId !== requestIdRef.current) return;

      if (result.success) {
        setData((current) => ({
          ...current,
          userReaction: result.newReaction,
        }));
      } else {
        setData(previousData);
      }
    } catch {
      if (currentRequestId === requestIdRef.current) {
        setData(previousData);
      }
    } finally {
      setIsPending(false);
    }
  };

  return { data, isPending, toggle };
}
