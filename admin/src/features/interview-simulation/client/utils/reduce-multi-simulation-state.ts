import type { OverallEvaluation, SimulatedTurn } from "../../shared/schemas";
import type {
  MultiSimulationProgressEvent,
  PersonaSimulationResult,
  PersonaSlotDescriptor,
} from "../../shared/types";

/**
 * 1 スロットの UI 上の状態。ストリーミング進捗を蓄積する。
 */
export interface PersonaSlotState {
  descriptor: PersonaSlotDescriptor;
  status: "pending" | "running" | "complete" | "error";
  message: string | null;
  turns: SimulatedTurn[];
  result: PersonaSimulationResult | null;
  error: string | null;
}

/**
 * ストリーミング全体の UI 状態
 */
export interface MultiSimulationState {
  /** plan を受け取るまで null、以降は personaIndex 順に並ぶ */
  slots: PersonaSlotState[] | null;
  /** 全体向けのステータスメッセージ（plan 前 or エラー時） */
  globalStatus: string | null;
  /** all_complete を受け取ったら総経過時間が入る */
  totalElapsedMs: number | null;
  /** 致命的な切断エラー等（ストリーム読み込み自体が失敗した場合） */
  fatalError: string | null;
  /** 総合評価（全スロット完走後に LLM がまとめる）。running/done/failed を区別する */
  overallEvaluation:
    | { status: "idle" }
    | { status: "running" }
    | { status: "complete"; evaluation: OverallEvaluation }
    | { status: "failed"; message: string };
}

export const initialMultiSimulationState: MultiSimulationState = {
  slots: null,
  globalStatus: null,
  totalElapsedMs: null,
  fatalError: null,
  overallEvaluation: { status: "idle" },
};

function updateSlot(
  slots: PersonaSlotState[] | null,
  personaIndex: number,
  updater: (slot: PersonaSlotState) => PersonaSlotState
): PersonaSlotState[] | null {
  if (!slots) return slots;
  const target = slots[personaIndex];
  if (!target) return slots;
  const next = slots.slice();
  next[personaIndex] = updater(target);
  return next;
}

/**
 * MultiSimulationProgressEvent を 1 件処理して新しい状態を返す純粋関数。
 * React の setState に渡しても決定論的に動くよう、Object identity を更新対象だけ変える。
 */
export function reduceMultiSimulationState(
  state: MultiSimulationState,
  event: MultiSimulationProgressEvent
): MultiSimulationState {
  switch (event.type) {
    case "plan": {
      const slots: PersonaSlotState[] = event.personaSlots.map(
        (descriptor) => ({
          descriptor,
          status: "pending",
          message: null,
          turns: [],
          result: null,
          error: null,
        })
      );
      return { ...state, slots, globalStatus: null };
    }
    case "global_status":
      return { ...state, globalStatus: event.message };
    case "persona_started":
      // 1 件目のスロット開始 = planning など global フェーズの終了。
      // global ステータスを残したままだと「多様な当事者像を計画中...」が
      // 完了後も画面に出続けるので、ここでクリアする
      return {
        ...state,
        globalStatus: null,
        slots: updateSlot(state.slots, event.personaIndex, (slot) => ({
          ...slot,
          status: "running",
        })),
      };
    case "persona_status":
      return {
        ...state,
        slots: updateSlot(state.slots, event.personaIndex, (slot) => ({
          ...slot,
          message: event.message,
          status: slot.status === "pending" ? "running" : slot.status,
        })),
      };
    case "turn":
      // 順序保持を前提にしているが、遅延イベントで complete/error の後に
      // turn が届いた場合に確定ステータスを running に戻さない
      return {
        ...state,
        slots: updateSlot(state.slots, event.personaIndex, (slot) => ({
          ...slot,
          turns: [...slot.turns, event.turn],
          status: slot.status === "pending" ? "running" : slot.status,
        })),
      };
    case "persona_complete":
      return {
        ...state,
        slots: updateSlot(state.slots, event.personaIndex, (slot) => ({
          ...slot,
          status: "complete",
          result: event.result,
          message: null,
        })),
      };
    case "persona_error":
      return {
        ...state,
        slots: updateSlot(state.slots, event.personaIndex, (slot) => ({
          ...slot,
          status: "error",
          error: event.message,
          message: null,
        })),
      };
    case "overall_evaluation_started":
      return { ...state, overallEvaluation: { status: "running" } };
    case "overall_evaluation_complete":
      return {
        ...state,
        overallEvaluation: { status: "complete", evaluation: event.evaluation },
      };
    case "overall_evaluation_failed":
      return {
        ...state,
        overallEvaluation: { status: "failed", message: event.message },
      };
    case "all_complete":
      return { ...state, totalElapsedMs: event.totalElapsedMs };
    default:
      return state;
  }
}
