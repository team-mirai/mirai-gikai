"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useSpeechSynthesis } from "./use-speech-synthesis";

export type VoiceModePhase = "idle" | "speaking" | "listening" | "processing";

interface UseVoiceModeOptions {
  isAiResponding: boolean;
  /** Update the text input value — transcript syncs here in real time */
  onInputChange: (text: string) => void;
  silenceTimeoutMs?: number;
}

interface UseVoiceModeReturn {
  isVoiceModeOn: boolean;
  phase: VoiceModePhase;
  isSupported: boolean;
  isTtsEnabled: boolean;
  showSilenceNotification: boolean;
  ttsAnalyserNode: AnalyserNode | null;
  micMediaStream: MediaStream | null;

  toggleVoiceMode: () => void;
  disableVoiceMode: () => void;
  /** Call when user manually sends a message while voice mode is on */
  notifyMessageSent: () => void;
  toggleTts: () => void;
  speakMessage: (text: string) => void;
  dismissSilenceNotification: () => void;
}

export function useVoiceMode(options: UseVoiceModeOptions): UseVoiceModeReturn {
  const { isAiResponding, onInputChange, silenceTimeoutMs = 10000 } = options;

  const [isVoiceModeOn, setIsVoiceModeOn] = useState(false);
  const [phase, setPhase] = useState<VoiceModePhase>("idle");
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [showSilenceNotification, setShowSilenceNotification] = useState(false);

  const onInputChangeRef = useRef(onInputChange);
  onInputChangeRef.current = onInputChange;

  // TTS hook
  const tts = useSpeechSynthesis({
    onEnd: () => {
      if (isVoiceModeOn) {
        setPhase("listening");
        stt.startListening();
      }
    },
    onError: () => {
      if (isVoiceModeOn) {
        setPhase("listening");
        stt.startListening();
      }
    },
  });

  // STT hook
  const stt = useSpeechRecognition({
    lang: "ja-JP",
    silenceTimeoutMs,
    onSilenceTimeout: () => {
      // No speech detected for silenceTimeoutMs → auto-end voice mode
      setIsVoiceModeOn(false);
      setPhase("idle");
      setShowSilenceNotification(true);
    },
    onError: (error) => {
      if (error === "not-allowed" || error === "session-failed") {
        setIsVoiceModeOn(false);
        setPhase("idle");
      }
    },
  });

  // Sync STT transcript → text input in real time
  useEffect(() => {
    if (isVoiceModeOn && stt.transcript) {
      onInputChangeRef.current(stt.transcript);
    }
  }, [isVoiceModeOn, stt.transcript]);

  // Toggle voice mode ON/OFF
  const toggleVoiceMode = useCallback(() => {
    if (isVoiceModeOn) {
      tts.cancel();
      stt.stopListening();
      setIsVoiceModeOn(false);
      setPhase("idle");
    } else {
      setIsVoiceModeOn(true);
      setShowSilenceNotification(false);

      if (isAiResponding) {
        setPhase("processing");
      } else {
        setPhase("listening");
        stt.startListening();
      }
    }
  }, [isVoiceModeOn, isAiResponding, tts, stt]);

  const disableVoiceMode = useCallback(() => {
    tts.cancel();
    stt.stopListening();
    setIsVoiceModeOn(false);
    setPhase("idle");
  }, [tts, stt]);

  // Called when user manually sends a message
  const notifyMessageSent = useCallback(() => {
    stt.stopListening();
    setPhase("processing");
  }, [stt]);

  const toggleTts = useCallback(() => {
    setIsTtsEnabled((prev) => !prev);
    if (isTtsEnabled && tts.isSpeaking) {
      tts.cancel();
      setPhase("listening");
      stt.startListening();
    }
  }, [isTtsEnabled, tts, stt]);

  // Speak an AI message (called from chat container)
  const speakMessage = useCallback(
    (text: string) => {
      if (!isVoiceModeOn) return;

      if (isTtsEnabled) {
        setPhase("speaking");
        tts.speak(text);
      } else {
        setPhase("listening");
        stt.startListening();
      }
    },
    [isVoiceModeOn, isTtsEnabled, tts, stt]
  );

  const dismissSilenceNotification = useCallback(() => {
    setShowSilenceNotification(false);
  }, []);

  return {
    isVoiceModeOn,
    phase,
    isSupported: stt.isSupported,
    isTtsEnabled,
    showSilenceNotification,
    ttsAnalyserNode: tts.analyserNode,
    micMediaStream: stt.mediaStream,

    toggleVoiceMode,
    disableVoiceMode,
    notifyMessageSent,
    toggleTts,
    speakMessage,
    dismissSilenceNotification,
  };
}
