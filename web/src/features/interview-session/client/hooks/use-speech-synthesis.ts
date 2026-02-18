"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  /** AudioContext analyser node for waveform visualization */
  analyserNode: AnalyserNode | null;
}

export function useSpeechSynthesis(
  options?: UseSpeechSynthesisOptions
): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsSpeaking(false);
    setAnalyserNode(null);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      cleanup();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setIsSpeaking(true);

        const response = await fetch("/api/interview/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (abortController.signal.aborted) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Set up Web Audio API for waveform visualization
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const source = audioContext.createMediaElementSource(audio);
        sourceNodeRef.current = source;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        setAnalyserNode(analyser);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          setAnalyserNode(null);
          if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
          }
          optionsRef.current?.onEnd?.();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          cleanup();
          optionsRef.current?.onError?.(new Error("Audio playback failed"));
        };

        await audio.play();
      } catch (error) {
        if (abortController.signal.aborted) return;
        cleanup();
        optionsRef.current?.onError?.(error);
      }
    },
    [cleanup]
  );

  const cancel = useCallback(() => {
    cleanup();
    // Don't call onEnd for manual cancel
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [cleanup]);

  return { speak, cancel, isSpeaking, analyserNode };
}
