import { useCallback, useRef, useState } from "react";

/**
 * stateとrefを同時に管理するカスタムフック
 * stateの更新と同時にrefも更新されるため、コールバック内で常に最新の値を参照できる
 */
export function useStateWithRef<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(state);

  const set = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next =
        typeof value === "function" ? (value as (p: T) => T)(prev) : value;

      ref.current = next; // 同時更新
      return next;
    });
  }, []);

  return [state, set, ref] as const;
}
