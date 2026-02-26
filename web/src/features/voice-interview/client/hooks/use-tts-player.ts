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

    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    // Chrome workaround: cancel any pending/stuck utterances before speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = parseRate(rate);

    const onAbort = () => {
      window.speechSynthesis.cancel();
      reject(new DOMException("Aborted", "AbortError"));
    };

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

  // Cleanup on unmount: abort in-flight requests, stop audio, cancel speech
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      playerRef.current?.dispose();
      playerRef.current = null;
      window.speechSynthesis?.cancel();
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
        // Edge TTS のサーバーリトライ待ちを避けるため10秒でタイムアウト
        const timeoutSignal = AbortSignal.timeout(10_000);
        const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, rate: options?.rate }),
          signal: combinedSignal,
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          throw new Error(`TTS error ${response.status}: ${errBody}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);

        if (signal.aborted || combinedSignal.aborted) {
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

  /**
   * 文の配列を並列にTTSリクエストし、順番に再生する。
   * 最初の文が返った時点で再生開始するため体感速度が向上する。
   */
  const speakChunked = useCallback(
    async (
      sentences: string[],
      options?: { rate?: string; onStart?: () => void; onEnd?: () => void }
    ) => {
      const player = getPlayer();
      await player.resume();

      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setIsSpeaking(true);

      try {
        // 全文のTTSリクエストを並列発行（signal経由で一括中断可能）
        const fetchPromises = sentences.map((sentence) => {
          const timeoutSignal = AbortSignal.timeout(10_000);
          const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

          return fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: sentence, rate: options?.rate }),
            signal: combinedSignal,
          }).then(async (response) => {
            if (!response.ok) {
              const errBody = await response.text().catch(() => "");
              throw new Error(`TTS error ${response.status}: ${errBody}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);
          });
        });

        // 完了コールバックを先に設定（レース回避）
        const playbackDone = new Promise<void>((resolve) => {
          player.setOnComplete(() => resolve());
        });

        // 順番にawaitして再生キューに追加
        let enqueuedCount = 0;
        for (let i = 0; i < fetchPromises.length; i++) {
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          const audioData = await fetchPromises[i];

          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          // 最初の文の再生開始時にonStartを呼ぶ
          if (i === 0) {
            options?.onStart?.();
          }

          await player.play(audioData);
          enqueuedCount++;
        }

        // 全再生完了を待つ
        if (enqueuedCount > 0 && player.isPlaying) {
          await playbackDone;
        }

        options?.onEnd?.();
      } catch (err) {
        // エラー時に残りのリクエストを中断
        abortRef.current?.abort();
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }

        console.warn(
          "[TTS] Chunked TTS failed, falling back to Web Speech:",
          err
        );
        try {
          options?.onStart?.();
          await webSpeechFallback(sentences.join(""), options?.rate, signal);
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

  return { speak, speakChunked, stop, isSpeaking };
}
