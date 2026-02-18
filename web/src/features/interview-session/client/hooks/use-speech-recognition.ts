"use client";

import { useEffect, useState } from "react";
import { useSpeechRecognitionGoogle } from "./use-speech-recognition-google";
import { useSpeechRecognitionOpenai } from "./use-speech-recognition-openai";

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionReturn {
  startListening: (initialTranscript?: string) => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  /** MediaStream for waveform visualization */
  mediaStream: MediaStream | null;
}

type SttProvider = "openai" | "google";

const NOOP_RETURN: UseSpeechRecognitionReturn = {
  startListening: () => {},
  stopListening: () => {},
  isListening: false,
  transcript: "",
  isSupported: false,
  mediaStream: null,
};

export function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions
): UseSpeechRecognitionReturn {
  const [provider, setProvider] = useState<SttProvider | null>(null);

  useEffect(() => {
    fetch("/api/interview/stt/config")
      .then((res) => res.json())
      .then((data) => setProvider(data.provider ?? "openai"))
      .catch(() => setProvider("openai"));
  }, []);

  // Both hooks must be called unconditionally (React rules of hooks).
  // The inactive hook receives undefined options and returns a no-op.
  const openai = useSpeechRecognitionOpenai(
    provider === "openai" ? options : undefined
  );
  const google = useSpeechRecognitionGoogle(
    provider === "google" ? options : undefined
  );

  if (!provider) return NOOP_RETURN;
  return provider === "openai" ? openai : google;
}
