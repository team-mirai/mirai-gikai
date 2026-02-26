"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ??
    w.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
}

/** 最後の音声入力から確定までの無音タイムアウト（ミリ秒） */
const SILENCE_TIMEOUT_MS = 2500;

/** 1回の発話の最大録音時間（ミリ秒）。長すぎる発話を自動で区切る */
const MAX_RECORDING_DURATION_MS = 120_000; // 2分

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef<((text: string, isFinal: boolean) => void) | null>(
    null
  );
  const onErrorRef = useRef<(() => void) | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const accumulatedTextRef = useRef("");
  const onMaxDurationRef = useRef<(() => void) | null>(null);

  // SSR/CSR 間の hydration mismatch を防ぐため useEffect で判定
  const [isSupported, setIsSupported] = useState(true);
  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearSilenceTimer();
    clearMaxDurationTimer();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    onResultRef.current = null;
    onErrorRef.current = null;
    onMaxDurationRef.current = null;
    accumulatedTextRef.current = "";
    setIsListening(false);
    setTranscript("");
  }, [clearSilenceTimer, clearMaxDurationTimer]);

  const start = useCallback(
    (
      onResult: (text: string, isFinal: boolean) => void,
      onError?: () => void,
      options?: { onMaxDuration?: () => void }
    ) => {
      const SpeechRecognition = getSpeechRecognition();
      if (!SpeechRecognition) return false;

      onResultRef.current = onResult;
      onErrorRef.current = onError ?? null;
      onMaxDurationRef.current = options?.onMaxDuration ?? null;
      accumulatedTextRef.current = "";
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;

      /** 現在の認識テキストを保持（タイマーから参照） */
      let latestTranscript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // continuous モードでは複数の結果が累積される
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        latestTranscript = fullTranscript;
        setTranscript(fullTranscript);
        onResultRef.current?.(fullTranscript, false);

        // 発話がある度に無音タイマーをリセット
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          // 無音が続いたので確定
          if (fullTranscript.trim()) {
            onResultRef.current?.(fullTranscript, true);
          }
          recognition.stop();
        }, SILENCE_TIMEOUT_MS);
      };

      recognition.onerror = (event) => {
        clearSilenceTimer();
        clearMaxDurationTimer();
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.error("[SpeechRecognition] error:", event.error);
          onErrorRef.current?.();
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        clearSilenceTimer();
        clearMaxDurationTimer();
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setTranscript("");

      // 最大録音時間タイマーを開始
      clearMaxDurationTimer();
      maxDurationTimerRef.current = setTimeout(() => {
        maxDurationTimerRef.current = null;
        clearSilenceTimer();
        onMaxDurationRef.current?.();
        // ここまでのテキストを確定して停止
        if (latestTranscript.trim()) {
          onResultRef.current?.(latestTranscript, true);
        }
        recognition.stop();
      }, MAX_RECORDING_DURATION_MS);

      return true;
    },
    [clearSilenceTimer, clearMaxDurationTimer]
  );

  return {
    isSupported,
    isListening,
    transcript,
    start,
    stop,
  };
}
