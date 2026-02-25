import type { VoiceState } from "./utils/voice-state-machine";

export type { VoiceState, VoiceEvent } from "./utils/voice-state-machine";

export interface VoiceInterviewMessage {
  role: "user" | "assistant";
  content: string;
}

export interface VoiceInterviewProps {
  interviewSessionId: string;
  systemPrompt: string;
  onComplete?: (messages: VoiceInterviewMessage[]) => void;
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface VoiceInterviewHookReturn {
  state: VoiceState;
  messages: VoiceInterviewMessage[];
  currentTranscript: string;
  startListening: () => void;
  stopSpeaking: () => void;
  errorMessage: string | null;
}
