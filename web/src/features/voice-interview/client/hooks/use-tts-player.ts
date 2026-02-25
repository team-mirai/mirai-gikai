"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "../utils/audio-player";

function parseRate(rate?: string): number {
  if (!rate) return 1.0;
  const trimmed = rate.trim();
  if (trimmed.endsWith("%")) {
    const pct = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isNaN(pct) ? 1.0 : 1.0 + pct / 100;
  }
  const num = Number.parseFloat(trimmed);
  return Number.isNaN(num) ? 1.0 : num;
}

function webSpeechFallback(
  text: string,
  rate?: string,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Web Speech Synthesis not supported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = parseRate(rate);

    const onAbort = () => {
      window.speechSynthesis.cancel();
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });

    utterance.onend = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    };

    utterance.onerror = (e) => {
      signal?.removeEventListener("abort", onAbort);
      if (e.error === "canceled" || e.error === "interrupted") {
        reject(new DOMException("Aborted", "AbortError"));
      } else {
        reject(new Error(`Web Speech error: ${e.error}`));
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function useTtsPlayer() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new AudioPlayer();
    }
    return playerRef.current;
  }, []);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  const speak = useCallback(
    async (
      text: string,
      options?: { rate?: string; onStart?: () => void; onEnd?: () => void }
    ) => {
      const player = getPlayer();
      await player.resume();

      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setIsSpeaking(true);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, rate: options?.rate }),
          signal,
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          throw new Error(`TTS error ${response.status}: ${errBody}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);

        if (signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        options?.onStart?.();

        await new Promise<void>((resolve, reject) => {
          player.setOnComplete(() => {
            resolve();
          });
          player.play(audioData).catch(reject);
        });

        options?.onEnd?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }

        console.warn("[TTS] Edge TTS failed, falling back to Web Speech:", err);
        try {
          options?.onStart?.();
          await webSpeechFallback(text, options?.rate, signal);
          options?.onEnd?.();
        } catch (fallbackErr) {
          if (
            fallbackErr instanceof DOMException &&
            fallbackErr.name === "AbortError"
          ) {
            throw fallbackErr;
          }
          throw fallbackErr;
        }
      } finally {
        setIsSpeaking(false);
        abortRef.current = null;
      }
    },
    [getPlayer]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    playerRef.current?.cancelAll();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
