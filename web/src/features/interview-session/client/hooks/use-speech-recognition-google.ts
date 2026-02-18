"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { float32ToPcm16Buffer } from "../utils/audio-utils";
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

/** How long a single streaming session lasts before auto-reconnect (ms). */
const SESSION_DURATION_MS = 55_000;

export function useSpeechRecognitionGoogle(
  options: UseSpeechRecognitionOptions | undefined
): UseSpeechRecognitionReturn {
  const isActive = options !== undefined;
  const lang = options?.lang ?? "ja-JP";

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isListeningRef = useRef(false);
  const committedTextRef = useRef("");
  const currentSegmentRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const abortControllerRef = useRef<AbortController | null>(null);
  const audioWriterRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(
    null
  );
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) return;
    setIsSupported(
      Boolean(navigator.mediaDevices?.getUserMedia) &&
        Boolean(window.ReadableStream)
    );
  }, [isActive]);

  const cleanupStream = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioWriterRef.current) {
      audioWriterRef.current.close().catch(() => {});
      audioWriterRef.current = null;
    }
  }, []);

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

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    cleanupStream();
    cleanupAudio();
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
      setMediaStream(null);
    }
    setIsListening(false);
  }, [cleanupStream, cleanupAudio]);

  const handleGoogleEvent = useCallback(
    (event: { type: string; transcript?: string; is_final?: boolean }) => {
      switch (event.type) {
        case "interim": {
          if (event.transcript !== undefined) {
            currentSegmentRef.current = event.transcript;
            setTranscript(committedTextRef.current + currentSegmentRef.current);
          }
          break;
        }
        case "final": {
          if (event.transcript !== undefined) {
            committedTextRef.current += event.transcript;
            currentSegmentRef.current = "";
            setTranscript(committedTextRef.current);
          }
          break;
        }
        case "error": {
          console.error("Google STT error:", event);
          break;
        }
        default:
          break;
      }
    },
    []
  );

  /**
   * Start (or restart) the streaming fetch connection to the Google
   * STT proxy. Audio capture is set up separately and persists across
   * reconnects.
   */
  const startStreamingSession = useCallback(
    (audioStream: MediaStream) => {
      cleanupStream();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const { readable, writable } = new TransformStream<Uint8Array>();
      const writer = writable.getWriter();
      audioWriterRef.current = writer;

      // Set up audio capture if not already running
      if (!audioContextRef.current) {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(audioStream);
        sourceRef.current = source;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!isListeningRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16Buffer = float32ToPcm16Buffer(inputData);
          const currentWriter = audioWriterRef.current;
          if (currentWriter) {
            currentWriter.write(new Uint8Array(pcm16Buffer)).catch(() => {});
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      }

      // Start streaming request to proxy
      const fetchPromise = fetch("/api/interview/stt/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Language": lang,
        },
        body: readable,
        signal: abortController.signal,
        // @ts-expect-error -- duplex is required for streaming request bodies
        duplex: "half",
      });

      // Read streaming response
      fetchPromise
        .then(async (response) => {
          if (!response.ok || !response.body) return;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const event = JSON.parse(line);
                handleGoogleEvent(event);
              } catch {
                // Ignore malformed lines
              }
            }
          }
        })
        .catch(() => {
          // Connection lost — will auto-reconnect if still listening
        })
        .finally(() => {
          // Auto-reconnect if still listening
          if (isListeningRef.current && streamRef.current) {
            startStreamingSession(streamRef.current);
          }
        });

      // Schedule a reconnect before Vercel timeout
      reconnectTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && streamRef.current) {
          // Close current writer to end the request, triggering reconnect in finally
          if (audioWriterRef.current) {
            audioWriterRef.current.close().catch(() => {});
            audioWriterRef.current = null;
          }
        }
      }, SESSION_DURATION_MS);
    },
    [lang, cleanupStream, handleGoogleEvent]
  );

  const startListening = useCallback(
    async (initialTranscript?: string) => {
      if (!isSupported) return;

      committedTextRef.current = initialTranscript ?? "";
      currentSegmentRef.current = "";
      setTranscript(initialTranscript ?? "");

      cleanupStream();
      cleanupAudio();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        setMediaStream(stream);
      } catch {
        optionsRef.current?.onError?.("not-allowed");
        return;
      }

      isListeningRef.current = true;
      setIsListening(true);

      startStreamingSession(stream);
    },
    [isSupported, cleanupStream, cleanupAudio, startStreamingSession]
  );

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      cleanupStream();
      cleanupAudio();
    };
  }, [cleanupStream, cleanupAudio]);

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
