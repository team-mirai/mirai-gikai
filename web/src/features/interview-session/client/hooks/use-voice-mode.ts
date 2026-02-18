"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useSpeechSynthesis } from "./use-speech-synthesis";

export type VoiceModePhase =
  | "idle"
  | "speaking"
  | "listening"
  | "countdown"
  | "processing";

interface UseVoiceModeOptions {
  onSubmitMessage: (text: string) => void;
  isAiResponding: boolean;
  silenceTimeoutMs?: number;
  countdownDurationMs?: number;
}

interface UseVoiceModeReturn {
  isVoiceModeOn: boolean;
  phase: VoiceModePhase;
  interimTranscript: string;
  isSupported: boolean;
  isTtsEnabled: boolean;
  countdownSeconds: number;
  showSilenceNotification: boolean;
  ttsAnalyserNode: AnalyserNode | null;
  micMediaStream: MediaStream | null;

  toggleVoiceMode: () => void;
  disableVoiceMode: () => void;
  toggleTts: () => void;
  speakMessage: (text: string) => void;
  sendNow: () => void;
  dismissSilenceNotification: () => void;
}

export function useVoiceMode(options: UseVoiceModeOptions): UseVoiceModeReturn {
  const {
    onSubmitMessage,
    isAiResponding,
    silenceTimeoutMs = 10000,
    countdownDurationMs = 3000,
  } = options;

  const [isVoiceModeOn, setIsVoiceModeOn] = useState(false);
  const [phase, setPhase] = useState<VoiceModePhase>("idle");
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [showSilenceNotification, setShowSilenceNotification] = useState(false);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTranscriptRef = useRef("");
  const onSubmitMessageRef = useRef(onSubmitMessage);
  onSubmitMessageRef.current = onSubmitMessage;

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
        // Fallback: start listening even if TTS fails
        setPhase("listening");
        stt.startListening();
      }
    },
  });

  // STT hook
  const stt = useSpeechRecognition({
    lang: "ja-JP",
    silenceTimeoutMs,
    onUtteranceEnd: (transcript) => {
      // Server VAD detected end of speech → start countdown if text exists
      if (transcript.trim()) {
        startCountdown(transcript);
      }
    },
    onSilenceTimeout: () => {
      // No speech detected for silenceTimeoutMs → auto-end voice mode
      const transcript = pendingTranscriptRef.current;
      if (transcript.trim()) {
        // Fallback: if somehow we have text, start countdown
        startCountdown(transcript);
      } else {
        setIsVoiceModeOn(false);
        setPhase("idle");
        setShowSilenceNotification(true);
      }
    },
    onError: (error) => {
      if (error === "not-allowed" || error === "session-failed") {
        setIsVoiceModeOn(false);
        setPhase("idle");
      }
    },
  });

  // Track transcript changes for countdown
  useEffect(() => {
    pendingTranscriptRef.current = stt.transcript;
  }, [stt.transcript]);

  // Clear countdown timers
  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownEndRef.current) {
      clearTimeout(countdownEndRef.current);
      countdownEndRef.current = null;
    }
    setCountdownSeconds(0);
  }, []);

  // Start countdown for auto-send
  const startCountdown = useCallback(
    (transcript: string) => {
      clearCountdown();
      setPhase("countdown");
      pendingTranscriptRef.current = transcript;

      const totalSeconds = Math.ceil(countdownDurationMs / 1000);
      setCountdownSeconds(totalSeconds);

      countdownTimerRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);

      countdownEndRef.current = setTimeout(() => {
        clearCountdown();
        const finalText = pendingTranscriptRef.current.trim();
        if (finalText) {
          setPhase("processing");
          onSubmitMessageRef.current(finalText);
        } else {
          setPhase("listening");
          stt.startListening();
        }
      }, countdownDurationMs);
    },
    [clearCountdown, countdownDurationMs, stt]
  );

  // Send immediately (skip countdown)
  const sendNow = useCallback(() => {
    clearCountdown();
    const finalText = pendingTranscriptRef.current.trim();
    if (finalText) {
      setPhase("processing");
      onSubmitMessageRef.current(finalText);
    }
  }, [clearCountdown]);

  // Toggle voice mode ON/OFF
  const toggleVoiceMode = useCallback(() => {
    if (isVoiceModeOn) {
      // Turn OFF
      tts.cancel();
      stt.stopListening();
      clearCountdown();
      setIsVoiceModeOn(false);
      setPhase("idle");
    } else {
      // Turn ON
      setIsVoiceModeOn(true);
      setShowSilenceNotification(false);

      if (isAiResponding) {
        setPhase("processing");
      } else {
        // Start listening immediately
        setPhase("listening");
        stt.startListening();
      }
    }
  }, [isVoiceModeOn, isAiResponding, tts, stt, clearCountdown]);

  const disableVoiceMode = useCallback(() => {
    tts.cancel();
    stt.stopListening();
    clearCountdown();
    setIsVoiceModeOn(false);
    setPhase("idle");
  }, [tts, stt, clearCountdown]);

  const toggleTts = useCallback(() => {
    setIsTtsEnabled((prev) => !prev);
    // If currently speaking and user disables TTS, stop speaking
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
        // Skip TTS, go straight to listening
        setPhase("listening");
        stt.startListening();
      }
    },
    [isVoiceModeOn, isTtsEnabled, tts, stt]
  );

  // Watch for AI response finishing while in processing phase
  useEffect(() => {
    if (isVoiceModeOn && phase === "processing" && !isAiResponding) {
      // AI finished responding, will be handled by speakMessage call
      // from the parent component
    }
  }, [isVoiceModeOn, phase, isAiResponding]);

  const dismissSilenceNotification = useCallback(() => {
    setShowSilenceNotification(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  return {
    isVoiceModeOn,
    phase,
    interimTranscript: stt.transcript,
    isSupported: stt.isSupported,
    isTtsEnabled,
    countdownSeconds,
    showSilenceNotification,
    ttsAnalyserNode: tts.analyserNode,
    micMediaStream: stt.mediaStream,

    toggleVoiceMode,
    disableVoiceMode,
    toggleTts,
    speakMessage,
    sendNow,
    dismissSilenceNotification,
  };
}
