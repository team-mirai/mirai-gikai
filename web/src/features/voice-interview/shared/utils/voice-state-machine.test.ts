import { describe, expect, it } from "vitest";
import {
  voiceReducer,
  type VoiceEvent,
  type VoiceState,
} from "./voice-state-machine";

describe("voiceReducer", () => {
  describe("idle state", () => {
    const state: VoiceState = "idle";

    it("transitions to listening on TAP_MIC", () => {
      expect(voiceReducer(state, { type: "TAP_MIC" })).toBe("listening");
    });

    it("transitions to error on ERROR", () => {
      expect(voiceReducer(state, { type: "ERROR", error: "test" })).toBe(
        "error"
      );
    });

    it("stays idle on unrelated events", () => {
      const unrelatedEvents: VoiceEvent[] = [
        { type: "SPEECH_RESULT", text: "hello" },
        { type: "SPEECH_END" },
        { type: "LLM_COMPLETE", text: "response" },
        { type: "TTS_START" },
        { type: "TTS_END" },
        { type: "RESET" },
      ];
      for (const event of unrelatedEvents) {
        expect(voiceReducer(state, event)).toBe("idle");
      }
    });
  });

  describe("listening state", () => {
    const state: VoiceState = "listening";

    it("stays listening on SPEECH_RESULT", () => {
      expect(
        voiceReducer(state, { type: "SPEECH_RESULT", text: "hello" })
      ).toBe("listening");
    });

    it("transitions to processing on SPEECH_END", () => {
      expect(voiceReducer(state, { type: "SPEECH_END" })).toBe("processing");
    });

    it("transitions to idle on TAP_MIC (cancel)", () => {
      expect(voiceReducer(state, { type: "TAP_MIC" })).toBe("idle");
    });

    it("transitions to idle on RESET (empty transcript)", () => {
      expect(voiceReducer(state, { type: "RESET" })).toBe("idle");
    });

    it("transitions to error on ERROR", () => {
      expect(voiceReducer(state, { type: "ERROR", error: "mic failed" })).toBe(
        "error"
      );
    });

    it("stays listening on unrelated events", () => {
      const unrelatedEvents: VoiceEvent[] = [
        { type: "LLM_COMPLETE", text: "response" },
        { type: "TTS_START" },
        { type: "TTS_END" },
      ];
      for (const event of unrelatedEvents) {
        expect(voiceReducer(state, event)).toBe("listening");
      }
    });
  });

  describe("processing state", () => {
    const state: VoiceState = "processing";

    it("transitions to speaking on TTS_START", () => {
      expect(voiceReducer(state, { type: "TTS_START" })).toBe("speaking");
    });

    it("stays processing on LLM_COMPLETE (waits for TTS_START)", () => {
      expect(
        voiceReducer(state, { type: "LLM_COMPLETE", text: "response" })
      ).toBe("processing");
    });

    it("transitions to idle on TTS_END (TTS failed before starting)", () => {
      expect(voiceReducer(state, { type: "TTS_END" })).toBe("idle");
    });

    it("transitions to error on ERROR", () => {
      expect(voiceReducer(state, { type: "ERROR", error: "api error" })).toBe(
        "error"
      );
    });

    it("stays processing on unrelated events", () => {
      const unrelatedEvents: VoiceEvent[] = [
        { type: "TAP_MIC" },
        { type: "SPEECH_RESULT", text: "hello" },
        { type: "SPEECH_END" },
        { type: "RESET" },
      ];
      for (const event of unrelatedEvents) {
        expect(voiceReducer(state, event)).toBe("processing");
      }
    });
  });

  describe("speaking state", () => {
    const state: VoiceState = "speaking";

    it("transitions to idle on TTS_END", () => {
      expect(voiceReducer(state, { type: "TTS_END" })).toBe("idle");
    });

    it("transitions to listening on TAP_MIC (barge-in)", () => {
      expect(voiceReducer(state, { type: "TAP_MIC" })).toBe("listening");
    });

    it("transitions to error on ERROR", () => {
      expect(
        voiceReducer(state, { type: "ERROR", error: "playback error" })
      ).toBe("error");
    });

    it("stays speaking on unrelated events", () => {
      const unrelatedEvents: VoiceEvent[] = [
        { type: "SPEECH_RESULT", text: "hello" },
        { type: "SPEECH_END" },
        { type: "LLM_COMPLETE", text: "response" },
        { type: "TTS_START" },
        { type: "RESET" },
      ];
      for (const event of unrelatedEvents) {
        expect(voiceReducer(state, event)).toBe("speaking");
      }
    });
  });

  describe("error state", () => {
    const state: VoiceState = "error";

    it("transitions to listening on TAP_MIC (recovery)", () => {
      expect(voiceReducer(state, { type: "TAP_MIC" })).toBe("listening");
    });

    it("transitions to idle on RETRY", () => {
      expect(voiceReducer(state, { type: "RETRY" })).toBe("idle");
    });

    it("stays in error on all other events", () => {
      const otherEvents: VoiceEvent[] = [
        { type: "SPEECH_RESULT", text: "hello" },
        { type: "SPEECH_END" },
        { type: "LLM_COMPLETE", text: "response" },
        { type: "TTS_START" },
        { type: "TTS_END" },
        { type: "RESET" },
        { type: "ERROR", error: "another error" },
      ];
      for (const event of otherEvents) {
        expect(voiceReducer(state, event)).toBe("error");
      }
    });
  });

  describe("full flow scenarios", () => {
    it("completes a full conversation turn", () => {
      let state: VoiceState = "idle";

      state = voiceReducer(state, { type: "TAP_MIC" });
      expect(state).toBe("listening");

      state = voiceReducer(state, { type: "SPEECH_RESULT", text: "hello" });
      expect(state).toBe("listening");

      state = voiceReducer(state, { type: "SPEECH_END" });
      expect(state).toBe("processing");

      state = voiceReducer(state, { type: "TTS_START" });
      expect(state).toBe("speaking");

      state = voiceReducer(state, { type: "TTS_END" });
      expect(state).toBe("idle");
    });

    it("handles barge-in during speaking", () => {
      let state: VoiceState = "speaking";

      state = voiceReducer(state, { type: "TAP_MIC" });
      expect(state).toBe("listening");

      state = voiceReducer(state, { type: "SPEECH_END" });
      expect(state).toBe("processing");
    });

    it("handles error recovery", () => {
      let state: VoiceState = "processing";

      state = voiceReducer(state, { type: "ERROR", error: "api error" });
      expect(state).toBe("error");

      state = voiceReducer(state, { type: "TAP_MIC" });
      expect(state).toBe("listening");
    });

    it("handles cancel during listening", () => {
      let state: VoiceState = "listening";

      state = voiceReducer(state, { type: "TAP_MIC" });
      expect(state).toBe("idle");
    });

    it("handles empty transcript reset", () => {
      let state: VoiceState = "listening";

      state = voiceReducer(state, { type: "RESET" });
      expect(state).toBe("idle");
    });

    it("stays in processing until TTS_START, not LLM_COMPLETE", () => {
      let state: VoiceState = "processing";

      state = voiceReducer(state, {
        type: "LLM_COMPLETE",
        text: "response",
      });
      expect(state).toBe("processing");

      state = voiceReducer(state, { type: "TTS_START" });
      expect(state).toBe("speaking");
    });

    it("handles retry recovery from error to idle", () => {
      let state: VoiceState = "processing";

      state = voiceReducer(state, { type: "ERROR", error: "api error" });
      expect(state).toBe("error");

      state = voiceReducer(state, { type: "RETRY" });
      expect(state).toBe("idle");
    });

    it("recovers to idle when TTS fails before starting", () => {
      let state: VoiceState = "idle";

      state = voiceReducer(state, { type: "TAP_MIC" });
      expect(state).toBe("listening");

      state = voiceReducer(state, { type: "SPEECH_END" });
      expect(state).toBe("processing");

      // TTS fails before onStart → TTS_END dispatched from processing
      state = voiceReducer(state, { type: "TTS_END" });
      expect(state).toBe("idle");
    });
  });
});
