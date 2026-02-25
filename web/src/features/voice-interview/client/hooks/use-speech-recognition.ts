"use client";

import { useCallback, useRef, useState } from "react";

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

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef<((text: string, isFinal: boolean) => void) | null>(
    null
  );
  const onErrorRef = useRef<(() => void) | null>(null);

  const isSupported =
    typeof window !== "undefined" && getSpeechRecognition() !== null;

  const start = useCallback(
    (
      onResult: (text: string, isFinal: boolean) => void,
      onError?: () => void
    ) => {
      const SpeechRecognition = getSpeechRecognition();
      if (!SpeechRecognition) return false;

      onResultRef.current = onResult;
      onErrorRef.current = onError ?? null;
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          setTranscript(text);
          onResultRef.current?.(text, result.isFinal);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.error("[SpeechRecognition] error:", event.error);
          onErrorRef.current?.();
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setTranscript("");
      return true;
    },
    []
  );

  const stop = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    onResultRef.current = null;
    onErrorRef.current = null;
    setIsListening(false);
    setTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    start,
    stop,
  };
}
