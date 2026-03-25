"use client";

import { useEffect, useRef, useState } from "react";
import { toggleReaction } from "../../server/actions/toggle-reaction";
import type { ReactionType, ReportReactionData } from "../../shared/types";
import { computeOptimisticState } from "../../shared/utils/compute-optimistic-state";

/**
 * リアクションの楽観的更新とサーバー同期を管理するカスタムhook
 *
 * - クリック時に即座にUIを更新（楽観的更新）
 * - サーバーアクション失敗時はロールバック
 * - 親から渡されるinitialDataが変わった場合（フィルタ切替等）は同期
 */
export function useReactionToggle(
  reportId: string,
  initialData: ReportReactionData
) {
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  const prevInitialDataRef = useRef(initialData);

  useEffect(() => {
    if (prevInitialDataRef.current !== initialData) {
      prevInitialDataRef.current = initialData;
      setData(initialData);
    }
  }, [initialData]);

  const toggle = async (reactionType: ReactionType) => {
    if (isPending) return;

    const previousData = data;
    setData(computeOptimisticState(data, reactionType));
    setIsPending(true);

    try {
      const result = await toggleReaction(reportId, reactionType);
      if (!result.success) {
        setData(previousData);
      }
    } catch {
      setData(previousData);
    } finally {
      setIsPending(false);
    }
  };

  return { data, isPending, toggle };
}
