"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { float32ToPcm16Base64 } from "../utils/audio-utils";
import type {
  UseSpeechRecognitionOptions,
  UseSpeechRecognitionReturn,
} from "./use-speech-recognition";

const NOOP_RETURN: UseSpeechRecognitionReturn = {
  startListening: () => {},
  stopListening: () => {},
  isListening: false,
  transcript: "",
  isSupported: false,
  mediaStream: null,
};

export function useSpeechRecognitionOpenai(
  options: UseSpeechRecognitionOptions | undefined
): UseSpeechRecognitionReturn {
  const isActive = options !== undefined;
  const lang = options?.lang ?? "ja-JP";

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isListeningRef = useRef(false);
  const committedTextRef = useRef("");
  const currentSegmentRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    setIsSupported(
      Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(window.WebSocket)
    );
  }, [isActive]);

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
    cleanupAudio();
    cleanupWebSocket();
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        track.stop();
      }
      setMediaStream(null);
    }
    setIsListening(false);
  }, [cleanupAudio, cleanupWebSocket, mediaStream]);

  const startListening = useCallback(
    async (initialTranscript?: string) => {
      if (!isSupported) return;

      committedTextRef.current = initialTranscript ?? "";
      currentSegmentRef.current = "";
      setTranscript(initialTranscript ?? "");

      cleanupAudio();
      cleanupWebSocket();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMediaStream(stream);
      } catch {
        optionsRef.current?.onError?.("not-allowed");
        return;
      }

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

      const wsUrl = "wss://api.openai.com/v1/realtime?intent=transcription";
      const ws = new WebSocket(wsUrl, [
        "realtime",
        `openai-insecure-api-key.${clientSecret}`,
        "openai-beta.realtime-v1",
      ]);
      wsRef.current = ws;

      isListeningRef.current = true;
      setIsListening(true);

      ws.onopen = () => {
        const langCode = lang.split("-")[0];
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
                threshold: 0.3,
                prefix_padding_ms: 300,
                silence_duration_ms: 200,
              },
            },
          })
        );
        startAudioCapture(stream, ws);
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
        if (isListeningRef.current) {
          isListeningRef.current = false;
          setIsListening(false);
          cleanupAudio();
        }
      };

      function startAudioCapture(audioStream: MediaStream, socket: WebSocket) {
        const audioContext = new AudioContext({ sampleRate: 24000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(audioStream);
        sourceRef.current = source;

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
            const delta = data.delta as string | undefined;
            if (delta) {
              currentSegmentRef.current += delta;
              setTranscript(
                committedTextRef.current + currentSegmentRef.current
              );
            }
            break;
          }
          case "conversation.item.input_audio_transcription.completed": {
            const completedTranscript = data.transcript as string | undefined;
            const segmentText =
              completedTranscript ?? currentSegmentRef.current;
            committedTextRef.current += segmentText;
            currentSegmentRef.current = "";
            setTranscript(committedTextRef.current);
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
            break;
        }
      }
    },
    [isSupported, lang, cleanupAudio, cleanupWebSocket]
  );

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      cleanupAudio();
      cleanupWebSocket();
    };
  }, [cleanupAudio, cleanupWebSocket]);

  if (!isActive) return NOOP_RETURN;

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    isSupported,
    mediaStream,
  };
}
