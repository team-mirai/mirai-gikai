import { describe, expect, it } from "vitest";
import {
  type OptimisticState,
  computeOptimisticState,
} from "./compute-optimistic-state";

describe("computeOptimisticState", () => {
  it("未リアクションからhelpfulをクリックすると、helpful+1でuserReactionがhelpful", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: null,
    };
    const result = computeOptimisticState(state, "helpful");
    expect(result).toEqual({
      counts: { helpful: 6, hmm: 3 },
      userReaction: "helpful",
    });
  });

  it("未リアクションからhmmをクリックすると、hmm+1でuserReactionがhmm", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: null,
    };
    const result = computeOptimisticState(state, "hmm");
    expect(result).toEqual({
      counts: { helpful: 5, hmm: 4 },
      userReaction: "hmm",
    });
  });

  it("helpfulアクティブ状態で同じhelpfulをクリックすると解除", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: "helpful",
    };
    const result = computeOptimisticState(state, "helpful");
    expect(result).toEqual({
      counts: { helpful: 4, hmm: 3 },
      userReaction: null,
    });
  });

  it("hmmアクティブ状態で同じhmmをクリックすると解除", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: "hmm",
    };
    const result = computeOptimisticState(state, "hmm");
    expect(result).toEqual({
      counts: { helpful: 5, hmm: 2 },
      userReaction: null,
    });
  });

  it("helpfulアクティブ状態でhmmをクリックすると切り替え", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: "helpful",
    };
    const result = computeOptimisticState(state, "hmm");
    expect(result).toEqual({
      counts: { helpful: 4, hmm: 4 },
      userReaction: "hmm",
    });
  });

  it("hmmアクティブ状態でhelpfulをクリックすると切り替え", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: "hmm",
    };
    const result = computeOptimisticState(state, "helpful");
    expect(result).toEqual({
      counts: { helpful: 6, hmm: 2 },
      userReaction: "helpful",
    });
  });

  it("カウントが0の状態で解除しても0未満にならない", () => {
    const state: OptimisticState = {
      counts: { helpful: 0, hmm: 0 },
      userReaction: "helpful",
    };
    const result = computeOptimisticState(state, "helpful");
    expect(result).toEqual({
      counts: { helpful: 0, hmm: 0 },
      userReaction: null,
    });
  });

  it("元のstateを変更しない（イミュータブル）", () => {
    const state: OptimisticState = {
      counts: { helpful: 5, hmm: 3 },
      userReaction: null,
    };
    computeOptimisticState(state, "helpful");
    expect(state).toEqual({
      counts: { helpful: 5, hmm: 3 },
      userReaction: null,
    });
  });
});
