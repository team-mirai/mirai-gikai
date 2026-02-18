"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  silenceTimeoutMs?: number;
  onResult?: (transcript: string) => void;
  onSilenceTimeout?: () => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  /** MediaStream for waveform visualization */
  mediaStream: MediaStream | null;
}

export function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions
): UseSpeechRecognitionReturn {
  const lang = options?.lang ?? "ja-JP";
  const silenceTimeoutMs = options?.silenceTimeoutMs ?? 10000;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const restartCountRef = useRef(0);
  const accumulatedTranscriptRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        recognitionRef.current?.stop();
        setIsListening(false);
        optionsRef.current?.onSilenceTimeout?.();
      }
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, silenceTimeoutMs]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        track.stop();
      }
      setMediaStream(null);
    }
    setIsListening(false);
  }, [clearSilenceTimer, mediaStream]);

  const startListening = useCallback(async () => {
    if (!isSupported) return;

    // Clean up existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    // Get microphone stream for waveform visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMediaStream(stream);
    } catch {
      optionsRef.current?.onError?.("not-allowed");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognitionRef.current = recognition;

    isListeningRef.current = true;
    restartCountRef.current = 0;
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      restartCountRef.current = 0;
      startSilenceTimer();

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        accumulatedTranscriptRef.current += final;
      }

      const currentTranscript = accumulatedTranscriptRef.current + interim;
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      // Chrome auto-stops after ~60s, auto-restart if still listening
      if (isListeningRef.current) {
        restartCountRef.current++;
        if (restartCountRef.current <= 3) {
          try {
            const newRecognition = new SpeechRecognitionClass();
            newRecognition.continuous = true;
            newRecognition.interimResults = true;
            newRecognition.lang = lang;
            newRecognition.onresult = recognition.onresult;
            newRecognition.onend = recognition.onend;
            newRecognition.onerror = recognition.onerror;
            recognitionRef.current = newRecognition;
            newRecognition.start();
            return;
          } catch {
            // Fall through to silence timeout
          }
        }
        // Max restarts reached, treat as silence timeout
        isListeningRef.current = false;
        setIsListening(false);
        optionsRef.current?.onSilenceTimeout?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        isListeningRef.current = false;
        setIsListening(false);
        clearSilenceTimer();
        optionsRef.current?.onError?.("not-allowed");
      } else if (event.error === "no-speech") {
        // Ignore, handled by silence timer
      } else if (event.error === "aborted") {
        // Ignore, manual stop
      } else {
        optionsRef.current?.onError?.(event.error);
      }
    };

    try {
      recognition.start();
      startSilenceTimer();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      optionsRef.current?.onError?.("start-failed");
    }
  }, [isSupported, lang, startSilenceTimer, clearSilenceTimer]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    isSupported,
    mediaStream,
  };
}
