"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  voiceReducer,
  type VoiceState,
} from "../../shared/utils/voice-state-machine";
import type { VoiceInterviewMessage } from "../../shared/types";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useTtsPlayer } from "./use-tts-player";

interface UseVoiceInterviewOptions {
  billId: string;
  speechRate?: string;
  initialMessages?: VoiceInterviewMessage[];
}

/**
 * APIレスポンス（JSON文字列）からtextフィールドを抽出する。
 * パースに失敗した場合は元のテキストをそのまま返す。
 */
function extractTextFromResponse(raw: string): {
  text: string;
  nextStage?: string;
} {
  try {
    const parsed = JSON.parse(raw);
    return {
      text: parsed.text ?? raw,
      nextStage: parsed.next_stage,
    };
  } catch {
    return { text: raw };
  }
}

export function useVoiceInterview(options: UseVoiceInterviewOptions) {
  const { billId, speechRate, initialMessages = [] } = options;

  const [state, setState] = useState<VoiceState>("idle");
  const [messages, setMessages] =
    useState<VoiceInterviewMessage[]>(initialMessages);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stateRef = useRef<VoiceState>("idle");
  const messagesRef = useRef<VoiceInterviewMessage[]>(initialMessages);
  const currentStageRef = useRef<string>("chat");

  const speechRecognition = useSpeechRecognition();
  const ttsPlayer = useTtsPlayer();

  const dispatch = useCallback(
    (event: Parameters<typeof voiceReducer>[1]): VoiceState => {
      const newState = voiceReducer(stateRef.current, event);
      stateRef.current = newState;
      setState(newState);
      return newState;
    },
    []
  );

  const sendToLlm = useCallback(
    async (userText: string) => {
      const userMessage: VoiceInterviewMessage = {
        role: "user",
        content: userText,
      };
      const updatedMessages = [...messagesRef.current, userMessage];
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      try {
        const response = await fetch("/api/interview/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            billId,
            currentStage: currentStageRef.current,
            voice: true,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Chat API error ${response.status}: ${errText}`);
        }

        const responseText = await response.text();
        const { text: spokenText, nextStage } =
          extractTextFromResponse(responseText);

        // next_stageを追跡して次のリクエストに反映
        if (nextStage) {
          currentStageRef.current = nextStage;
        }

        const assistantMessage: VoiceInterviewMessage = {
          role: "assistant",
          content: responseText,
        };
        const finalMessages = [...messagesRef.current, assistantMessage];
        messagesRef.current = finalMessages;
        setMessages(finalMessages);

        try {
          await ttsPlayer.speak(spokenText, {
            rate: speechRate,
            onStart: () => {
              dispatch({ type: "TTS_START" });
            },
            onEnd: () => {
              dispatch({ type: "TTS_END" });
            },
          });
        } catch (ttsErr) {
          if (ttsErr instanceof DOMException && ttsErr.name === "AbortError") {
            return;
          }
          console.error("[VoiceInterview] TTS error:", ttsErr);
          dispatch({ type: "TTS_END" });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[VoiceInterview] LLM error:", msg);
        setErrorMessage(msg);
        dispatch({ type: "ERROR", error: msg });
      }
    },
    [billId, dispatch, ttsPlayer, speechRate]
  );

  const startListening = useCallback(() => {
    setErrorMessage(null);

    if (stateRef.current === "speaking") {
      ttsPlayer.stop();
    }

    const newState = dispatch({ type: "TAP_MIC" });

    if (newState === "idle") {
      speechRecognition.stop();
      return;
    }

    if (newState !== "listening") return;

    setCurrentTranscript("");

    const started = speechRecognition.start(
      (text: string, isFinal: boolean) => {
        setCurrentTranscript(text);

        if (isFinal) {
          speechRecognition.stop();
          setCurrentTranscript("");
          if (text.trim()) {
            dispatch({ type: "SPEECH_END" });
            sendToLlm(text.trim());
          } else {
            dispatch({ type: "RESET" });
          }
        }
      },
      () => {
        // onError callback from speech recognition
        if (stateRef.current === "listening") {
          dispatch({ type: "RESET" });
        }
        setCurrentTranscript("");
      }
    );

    if (!started) {
      setErrorMessage(
        "音声認識を開始できませんでした。ブラウザの設定を確認してください。"
      );
      dispatch({
        type: "ERROR",
        error: "Speech recognition failed to start",
      });
    }
  }, [dispatch, speechRecognition, ttsPlayer, sendToLlm]);

  const stopSpeaking = useCallback(() => {
    ttsPlayer.stop();
    if (stateRef.current === "speaking") {
      dispatch({ type: "TTS_END" });
    }
  }, [dispatch, ttsPlayer]);

  // Cleanup TTS player on unmount
  useEffect(() => {
    return () => {
      ttsPlayer.stop();
    };
  }, [ttsPlayer]);

  return {
    state,
    messages,
    currentTranscript,
    startListening,
    stopSpeaking,
    errorMessage,
    isSupported: speechRecognition.isSupported,
  };
}
