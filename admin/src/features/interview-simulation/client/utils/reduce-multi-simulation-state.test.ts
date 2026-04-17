import { describe, expect, it } from "vitest";
import type { SimulatedTurn } from "../../shared/schemas";
import type {
  MultiSimulationProgressEvent,
  PersonaSimulationResult,
} from "../../shared/types";
import {
  initialMultiSimulationState,
  reduceMultiSimulationState,
} from "./reduce-multi-simulation-state";

const planEvent: MultiSimulationProgressEvent = {
  type: "plan",
  personaSlots: [
    {
      personaIndex: 0,
      source: { kind: "report", reportId: "r1" },
      label: "レポート: A",
    },
    {
      personaIndex: 1,
      source: { kind: "bill", stanceHint: "for" },
      label: "自動生成: 賛成",
    },
  ],
};

const turn: SimulatedTurn = {
  role: "interviewer",
  content: "Q1",
  topic_title: null,
  question_id: null,
  next_stage: "chat",
  quick_replies: null,
};

describe("reduceMultiSimulationState", () => {
  it("plan イベントで slots を初期化する", () => {
    const next = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    expect(next.slots).toHaveLength(2);
    expect(next.slots?.[0]?.status).toBe("pending");
    expect(next.slots?.[0]?.descriptor.label).toBe("レポート: A");
    expect(next.slots?.[1]?.descriptor.label).toBe("自動生成: 賛成");
  });

  it("persona_started で running に遷移する", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    state = reduceMultiSimulationState(state, {
      type: "persona_started",
      personaIndex: 0,
    });
    expect(state.slots?.[0]?.status).toBe("running");
    expect(state.slots?.[1]?.status).toBe("pending");
  });

  it("turn イベントで対応スロットに append、他は変更なし", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    state = reduceMultiSimulationState(state, {
      type: "turn",
      personaIndex: 1,
      turnIndex: 0,
      turn,
    });
    expect(state.slots?.[0]?.turns).toEqual([]);
    expect(state.slots?.[1]?.turns).toHaveLength(1);
    expect(state.slots?.[1]?.status).toBe("running");
  });

  it("persona_complete で result をセットし status=complete", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    const result = {
      personaIndex: 0,
      personaSource: { kind: "report", reportId: "r1" },
      persona: {} as PersonaSimulationResult["persona"],
      personaModel: "openai/gpt-5.2",
      original: null,
      run: {} as PersonaSimulationResult["run"],
      elapsedMs: 1234,
      error: null,
    } as PersonaSimulationResult;
    state = reduceMultiSimulationState(state, {
      type: "persona_complete",
      personaIndex: 0,
      result,
    });
    expect(state.slots?.[0]?.status).toBe("complete");
    expect(state.slots?.[0]?.result).toBe(result);
  });

  it("persona_error で error 文字列をセット", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    state = reduceMultiSimulationState(state, {
      type: "persona_error",
      personaIndex: 1,
      message: "timeout",
    });
    expect(state.slots?.[1]?.status).toBe("error");
    expect(state.slots?.[1]?.error).toBe("timeout");
  });

  it("all_complete で totalElapsedMs をセット", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    state = reduceMultiSimulationState(state, {
      type: "all_complete",
      totalElapsedMs: 9999,
    });
    expect(state.totalElapsedMs).toBe(9999);
  });

  it("順不同のイベント（slot 1 が先に完了、slot 0 があとから turn）で決定論的", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    state = reduceMultiSimulationState(state, {
      type: "persona_started",
      personaIndex: 1,
    });
    state = reduceMultiSimulationState(state, {
      type: "turn",
      personaIndex: 1,
      turnIndex: 0,
      turn,
    });
    state = reduceMultiSimulationState(state, {
      type: "persona_started",
      personaIndex: 0,
    });
    state = reduceMultiSimulationState(state, {
      type: "turn",
      personaIndex: 0,
      turnIndex: 0,
      turn,
    });
    expect(state.slots?.[0]?.turns).toHaveLength(1);
    expect(state.slots?.[1]?.turns).toHaveLength(1);
  });

  it("plan 前のイベントは slots が null のままで無視される", () => {
    const state = reduceMultiSimulationState(initialMultiSimulationState, {
      type: "persona_started",
      personaIndex: 0,
    });
    expect(state.slots).toBeNull();
  });

  it("persona_started は globalStatus をクリアする（planning フェーズの後始末）", () => {
    let state = reduceMultiSimulationState(
      initialMultiSimulationState,
      planEvent
    );
    state = reduceMultiSimulationState(state, {
      type: "global_status",
      message: "多様な当事者像を計画中...",
    });
    expect(state.globalStatus).toBe("多様な当事者像を計画中...");
    state = reduceMultiSimulationState(state, {
      type: "persona_started",
      personaIndex: 0,
    });
    expect(state.globalStatus).toBeNull();
  });
});
