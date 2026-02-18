"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  silenceTimeoutMs?: number;
  onUtteranceEnd?: (transcript: string) => void;
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

/**
 * Converts Float32 audio samples to PCM16 (Int16) and returns base64 string.
 */
function float32ToPcm16Base64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions
): UseSpeechRecognitionReturn {
  const lang = options?.lang ?? "ja-JP";
  const silenceTimeoutMs = options?.silenceTimeoutMs ?? 10000;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(window.WebSocket);

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
        optionsRef.current?.onSilenceTimeout?.();
      }
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, silenceTimeoutMs]);

  const resetSilenceTimer = useCallback(() => {
    if (isListeningRef.current) {
      startSilenceTimer();
    }
  }, [startSilenceTimer]);

  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearSilenceTimer();
    cleanupAudio();
    cleanupWebSocket();
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        track.stop();
      }
      setMediaStream(null);
    }
    setIsListening(false);
  }, [clearSilenceTimer, cleanupAudio, cleanupWebSocket, mediaStream]);

  const startListening = useCallback(async () => {
    if (!isSupported) return;

    // Clean up any existing session
    cleanupAudio();
    cleanupWebSocket();

    // Get microphone stream
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
    } catch {
      optionsRef.current?.onError?.("not-allowed");
      return;
    }

    // Fetch ephemeral token
    let clientSecret: string;
    try {
      const tokenResponse = await fetch("/api/interview/stt/session", {
        method: "POST",
      });
      if (!tokenResponse.ok) {
        throw new Error(`Token fetch failed: ${tokenResponse.status}`);
      }
      const tokenData = await tokenResponse.json();
      clientSecret = tokenData.client_secret?.value;
      if (!clientSecret) {
        throw new Error("No client secret in response");
      }
    } catch (error) {
      console.error("Failed to get STT session token:", error);
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setMediaStream(null);
      optionsRef.current?.onError?.("session-failed");
      return;
    }

    // Connect WebSocket to OpenAI Realtime API
    const wsUrl = "wss://api.openai.com/v1/realtime?intent=transcription";
    const ws = new WebSocket(wsUrl, [
      "realtime",
      `openai-insecure-api-key.${clientSecret}`,
      "openai-beta.realtime-v1",
    ]);
    wsRef.current = ws;

    isListeningRef.current = true;
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    setIsListening(true);

    ws.onopen = () => {
      // Send transcription session configuration
      const langCode = lang.split("-")[0]; // "ja-JP" → "ja"
      ws.send(
        JSON.stringify({
          type: "transcription_session.update",
          session: {
            input_audio_format: "pcm16",
            input_audio_transcription: {
              model: "gpt-4o-mini-transcribe",
              language: langCode,
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 2000,
            },
          },
        })
      );

      // Start audio capture pipeline
      startAudioCapture(stream, ws);
      startSilenceTimer();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealtimeEvent(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      if (isListeningRef.current) {
        optionsRef.current?.onError?.("websocket-error");
      }
    };

    ws.onclose = () => {
      // If we were still listening, the connection was lost
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setIsListening(false);
        cleanupAudio();
        optionsRef.current?.onSilenceTimeout?.();
      }
    };

    function startAudioCapture(audioStream: MediaStream, socket: WebSocket) {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(audioStream);
      sourceRef.current = source;

      // ScriptProcessorNode for capturing raw PCM audio
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isListeningRef.current || socket.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const base64Audio = float32ToPcm16Base64(inputData);

        socket.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio,
          })
        );
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    }

    function handleRealtimeEvent(data: Record<string, unknown>) {
      const eventType = data.type as string;

      switch (eventType) {
        case "conversation.item.input_audio_transcription.delta": {
          // Interim transcription update
          const delta = data.delta as string | undefined;
          if (delta) {
            resetSilenceTimer();
            accumulatedTranscriptRef.current += delta;
            setTranscript(accumulatedTranscriptRef.current);
          }
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          // Final transcription for an utterance
          const completedTranscript = data.transcript as string | undefined;
          if (completedTranscript) {
            resetSilenceTimer();
            accumulatedTranscriptRef.current = completedTranscript;
            setTranscript(completedTranscript);
          }

          // Notify that user finished speaking
          const finalText = accumulatedTranscriptRef.current.trim();
          if (finalText) {
            optionsRef.current?.onUtteranceEnd?.(finalText);
          }
          break;
        }

        case "error": {
          const errorData = data.error as Record<string, unknown> | undefined;
          const errorMessage =
            (errorData?.message as string) ?? "unknown error";
          console.error("Realtime API error:", errorMessage);
          break;
        }

        default:
          // Ignore other events (session.created, etc.)
          break;
      }
    }
  }, [
    isSupported,
    lang,
    startSilenceTimer,
    resetSilenceTimer,
    cleanupAudio,
    cleanupWebSocket,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      clearSilenceTimer();
      cleanupAudio();
      cleanupWebSocket();
    };
  }, [clearSilenceTimer, cleanupAudio, cleanupWebSocket]);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    isSupported,
    mediaStream,
  };
}
