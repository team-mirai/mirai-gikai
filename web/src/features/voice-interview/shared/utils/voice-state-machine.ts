export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export type VoiceEvent =
  | { type: "TAP_MIC" }
  | { type: "SPEECH_RESULT"; text: string }
  | { type: "SPEECH_END" }
  | { type: "LLM_COMPLETE"; text: string }
  | { type: "TTS_START" }
  | { type: "TTS_END" }
  | { type: "RESET" }
  | { type: "RETRY" }
  | { type: "ERROR"; error: string };

export function voiceReducer(state: VoiceState, event: VoiceEvent): VoiceState {
  switch (state) {
    case "idle":
      if (event.type === "TAP_MIC") return "listening";
      if (event.type === "ERROR") return "error";
      return state;

    case "listening":
      if (event.type === "SPEECH_RESULT") return "listening";
      if (event.type === "SPEECH_END") return "processing";
      if (event.type === "TAP_MIC") return "idle";
      if (event.type === "RESET") return "idle";
      if (event.type === "ERROR") return "error";
      return state;

    case "processing":
      if (event.type === "TTS_START") return "speaking";
      if (event.type === "TTS_END") return "idle";
      if (event.type === "ERROR") return "error";
      return state;

    case "speaking":
      if (event.type === "TTS_END") return "idle";
      if (event.type === "TAP_MIC") return "listening";
      if (event.type === "ERROR") return "error";
      return state;

    case "error":
      if (event.type === "TAP_MIC") return "listening";
      if (event.type === "RETRY") return "idle";
      return state;

    default:
      return state;
  }
}
