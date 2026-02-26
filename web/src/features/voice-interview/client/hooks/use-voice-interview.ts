"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  voiceReducer,
  type VoiceState,
} from "../../shared/utils/voice-state-machine";
import type {
  InterviewStage,
  InterviewReportViewData,
} from "@/features/interview-session/shared/schemas";
import type { VoiceInterviewMessage } from "../../shared/types";
import { splitSentences } from "../../shared/utils/split-sentences";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useTtsPlayer } from "./use-tts-player";

interface UseVoiceInterviewOptions {
  billId: string;
  speechRate?: string;
  initialMessages?: VoiceInterviewMessage[];
  /**
   * デバッグ用: 音声認識・TTSをスキップして自動応答する。
   * 指定された文字列を順番に送信し、使い切ったら最後の応答を繰り返す。
   */
  autoResponses?: string[];
}

/**
 * APIレスポンスやDBメッセージ（JSON文字列）からtextフィールドを抽出する。
 * パースに失敗した場合は元のテキストをそのまま返す。
 */
function extractText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return parsed.text ?? raw;
  } catch {
    return raw;
  }
}

function extractResponse(raw: string): {
  text: string;
  nextStage?: InterviewStage;
  sessionId?: string;
  report?: InterviewReportViewData;
} {
  try {
    const parsed = JSON.parse(raw);
    // report から scores を除外して InterviewReportViewData に変換
    let report: InterviewReportViewData | undefined;
    if (parsed.report) {
      const { scores: _, ...viewData } = parsed.report;
      report = viewData;
    }
    return {
      text: parsed.text ?? raw,
      nextStage: parsed.next_stage,
      sessionId: parsed.session_id,
      report,
    };
  } catch {
    return { text: raw };
  }
}

/**
 * initialMessages の content をプレーンテキストに変換する。
 * DB由来のメッセージはJSON文字列の場合があるため。
 */
function normalizeMessages(
  msgs: VoiceInterviewMessage[]
): VoiceInterviewMessage[] {
  return msgs.map((m) => ({
    ...m,
    content: extractText(m.content),
  }));
}

/** デバッグ自動応答のデフォルト */
export const DEFAULT_AUTO_RESPONSES = [
  "はい、賛成です",
  "暫定税率が50年以上続いているのは異常だと思うので、一度廃止した上で議論すべきだと考えています",
  "廃止後にどれだけ財源が必要かをクリアにして、その上で適切な税率を議論すべきだと思います",
  "特に車をよく使う地方部の方は助かると思いますし、物流コストの削減は物価全体に良い影響があると思います",
  "特にありません",
  "はい、問題ありません",
  "はい、大丈夫です",
];

export function useVoiceInterview(options: UseVoiceInterviewOptions) {
  const { billId, speechRate, initialMessages = [], autoResponses } = options;
  const isAutoMode = !!autoResponses;
  const normalized = normalizeMessages(initialMessages);

  const [state, setState] = useState<VoiceState>("idle");
  const [messages, setMessages] = useState<VoiceInterviewMessage[]>(normalized);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interviewStage, setInterviewStage] = useState<InterviewStage>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<InterviewReportViewData | null>(
    null
  );

  const stateRef = useRef<VoiceState>("idle");
  const messagesRef = useRef<VoiceInterviewMessage[]>(normalized);
  const currentStageRef = useRef<InterviewStage>("chat");
  const currentTranscriptRef = useRef("");
  const autoStartedRef = useRef(false);
  const autoResponseIndexRef = useRef(0);
  const retryAttemptedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speechRecognition = useSpeechRecognition();
  const ttsPlayer = useTtsPlayer();

  // ref 経由でアクセスし、useCallback の依存配列を安定させる
  const ttsRef = useRef(ttsPlayer);
  ttsRef.current = ttsPlayer;
  const srRef = useRef(speechRecognition);
  srRef.current = speechRecognition;

  const dispatch = useCallback(
    (event: Parameters<typeof voiceReducer>[1]): VoiceState => {
      const newState = voiceReducer(stateRef.current, event);
      stateRef.current = newState;
      setState(newState);
      return newState;
    },
    []
  );

  // sendToLlm を ref で保持して循環依存を回避
  // (beginRecognition → sendToLlm → beginRecognition)
  const sendToLlmRef = useRef<((text: string) => Promise<void>) | undefined>(
    undefined
  );

  /**
   * 音声認識を開始する共通ロジック。
   * startListening（手動）と autoListen（TTS後自動）から呼ばれる。
   */
  const beginRecognition = useCallback(() => {
    setCurrentTranscript("");
    currentTranscriptRef.current = "";

    const started = srRef.current.start(
      (text: string, isFinal: boolean) => {
        setCurrentTranscript(text);
        currentTranscriptRef.current = text;

        if (isFinal) {
          srRef.current.stop();
          setCurrentTranscript("");
          currentTranscriptRef.current = "";
          if (text.trim()) {
            dispatch({ type: "SPEECH_END" });
            sendToLlmRef.current?.(text.trim());
          } else {
            dispatch({ type: "RESET" });
          }
        }
      },
      () => {
        if (stateRef.current === "listening") {
          dispatch({ type: "RESET" });
        }
        setCurrentTranscript("");
        currentTranscriptRef.current = "";
      }
    );

    return started;
  }, [dispatch]);

  /**
   * 自動応答モード: 次の応答テキストを取得して送信する。
   */
  const sendAutoResponse = useCallback(() => {
    if (!autoResponses) return;
    const idx = autoResponseIndexRef.current;
    const text = autoResponses[Math.min(idx, autoResponses.length - 1)];
    autoResponseIndexRef.current = idx + 1;
    // 少し待ってから送信（UIで進行が見えるように）
    setTimeout(() => {
      dispatch({ type: "SPEECH_END" });
      sendToLlmRef.current?.(text);
    }, 500);
  }, [autoResponses, dispatch]);

  /**
   * TTS終了後に自動で音声認識を開始する。
   * ボタンを押さなくても連続対話できる。
   * auto モードでは音声認識の代わりに自動応答を送信する。
   */
  const autoListen = useCallback(() => {
    if (stateRef.current !== "idle") return;

    if (isAutoMode) {
      sendAutoResponse();
      return;
    }

    const newState = dispatch({ type: "TAP_MIC" });
    if (newState !== "listening") return;

    if (!beginRecognition()) {
      dispatch({ type: "RESET" });
    }
  }, [dispatch, beginRecognition, isAutoMode, sendAutoResponse]);

  /**
   * テキストを TTS で再生し、終了後に自動で聞き取りを開始する。
   * 2文以上の場合は句点分割→並列TTS→順次再生で体感速度を改善。
   * auto モードでは TTS をスキップする。
   */
  const speakAndAutoListen = useCallback(
    async (text: string) => {
      if (isAutoMode) {
        // TTS スキップ → 即座に次の自動応答
        autoListen();
        return;
      }

      const ttsOptions = {
        rate: speechRate,
        onStart: () => {
          dispatch({ type: "TTS_START" });
        },
        onEnd: () => {
          dispatch({ type: "TTS_END" });
        },
      };

      try {
        const sentences = splitSentences(text);
        if (sentences.length > 1) {
          await ttsRef.current.speakChunked(sentences, ttsOptions);
        } else {
          await ttsRef.current.speak(text, ttsOptions);
        }
      } catch (ttsErr) {
        if (ttsErr instanceof DOMException && ttsErr.name === "AbortError") {
          // ユーザーが割り込み/停止した場合
          // startListening 側で既に listening に遷移しているのでここでは何もしない
          return;
        }
        console.error("[VoiceInterview] TTS error:", ttsErr);
        dispatch({ type: "TTS_END" });
      }

      // TTS完了後、自動で聞き取りモードに移行
      autoListen();
    },
    [dispatch, speechRate, autoListen, isAutoMode]
  );

  /**
   * TTS のみ再生する（自動リスニングなし）。
   * サマリーフェーズ等、対話を続行しない場合に使用。
   * auto モードでは TTS をスキップする。
   */
  const speakOnly = useCallback(
    async (text: string) => {
      if (isAutoMode) return;

      const ttsOptions = {
        rate: speechRate,
        onStart: () => {
          dispatch({ type: "TTS_START" });
        },
        onEnd: () => {
          dispatch({ type: "TTS_END" });
        },
      };

      try {
        const sentences = splitSentences(text);
        if (sentences.length > 1) {
          await ttsRef.current.speakChunked(sentences, ttsOptions);
        } else {
          await ttsRef.current.speak(text, ttsOptions);
        }
      } catch (ttsErr) {
        if (ttsErr instanceof DOMException && ttsErr.name === "AbortError") {
          return;
        }
        console.error("[VoiceInterview] TTS error:", ttsErr);
        dispatch({ type: "TTS_END" });
      }
    },
    [dispatch, speechRate, isAutoMode]
  );

  const sendToLlm = useCallback(
    async (userText: string) => {
      const userMessage: VoiceInterviewMessage = {
        role: "user",
        content: userText,
      };
      const updatedMessages = [...messagesRef.current, userMessage];
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      try {
        const response = await fetch("/api/interview/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            billId,
            currentStage: currentStageRef.current,
            voice: true,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Chat API error ${response.status}: ${errText}`);
        }

        const responseText = await response.text();
        const {
          text: spokenText,
          nextStage,
          sessionId: sid,
          report,
        } = extractResponse(responseText);

        if (nextStage) {
          currentStageRef.current = nextStage;
          setInterviewStage(nextStage);
        }
        if (sid) {
          setSessionId(sid);
        }
        if (report) {
          setReportData(report);
        }

        // リトライカウントをリセット
        retryAttemptedRef.current = false;

        const assistantMessage: VoiceInterviewMessage = {
          role: "assistant",
          content: spokenText,
        };
        const finalMessages = [...messagesRef.current, assistantMessage];
        messagesRef.current = finalMessages;
        setMessages(finalMessages);

        // サマリーフェーズではTTSのみ（自動リスニングしない）
        // await せず fire-and-forget で再生し、要約UIを即座に表示する
        const isSummary =
          nextStage === "summary" || nextStage === "summary_complete";
        if (isSummary) {
          speakOnly(spokenText);
        } else {
          await speakAndAutoListen(spokenText);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[VoiceInterview] LLM error:", msg);

        // 自動リトライ1回（2秒後）
        if (!retryAttemptedRef.current) {
          retryAttemptedRef.current = true;
          const lastUserText =
            messagesRef.current[messagesRef.current.length - 1]?.content;
          if (lastUserText) {
            // 失敗したユーザーメッセージを除去して再送信
            messagesRef.current = messagesRef.current.slice(0, -1);
            setMessages(messagesRef.current);
            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;
              sendToLlmRef.current?.(lastUserText);
            }, 2_000);
            return;
          }
        }

        setErrorMessage(msg);
        dispatch({ type: "ERROR", error: msg });
      }
    },
    [billId, dispatch, speakAndAutoListen, speakOnly]
  );

  // ref を常に最新に保つ
  sendToLlmRef.current = sendToLlm;

  /**
   * マイクボタンのタップハンドラ（手動トグル）。
   * - 初回タップ: 最初のAIメッセージをTTS再生→自動リスニング開始
   * - idle → listening
   * - listening → idle（キャンセル）
   * - speaking → listening（割り込み）
   */
  const startListening = useCallback(() => {
    setErrorMessage(null);

    // 初回タップ: AIの最初の質問をTTS再生し、終了後に自動リスニング
    if (!autoStartedRef.current) {
      autoStartedRef.current = true;
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      if (lastMsg?.role === "assistant") {
        void speakAndAutoListen(lastMsg.content).catch(console.error);
        return;
      }
    }

    // 進行中のTTSを停止（フェッチ中でも確実に中断する）
    ttsRef.current.stop();

    // listening 中にタップ → 認識途中のテキストがあれば送信する
    const wasListening = stateRef.current === "listening";
    const interimText = currentTranscriptRef.current.trim();

    const newState = dispatch({ type: "TAP_MIC" });

    if (newState === "idle") {
      srRef.current.stop();
      if (wasListening && interimText) {
        setCurrentTranscript("");
        currentTranscriptRef.current = "";
        dispatch({ type: "SPEECH_END" });
        sendToLlmRef.current?.(interimText);
      }
      return;
    }

    if (newState !== "listening") return;

    if (!beginRecognition()) {
      setErrorMessage(
        "音声認識を開始できませんでした。ブラウザの設定を確認してください。"
      );
      dispatch({
        type: "ERROR",
        error: "Speech recognition failed to start",
      });
    }
  }, [dispatch, beginRecognition, speakAndAutoListen]);

  /**
   * エラー状態からの手動回復。
   * 状態を idle に戻してエラーメッセージをクリアする。
   */
  const retry = useCallback(() => {
    retryAttemptedRef.current = false;
    setErrorMessage(null);
    dispatch({ type: "RETRY" });
  }, [dispatch]);

  const stopSpeaking = useCallback(() => {
    ttsRef.current.stop();
    if (stateRef.current === "speaking") {
      dispatch({ type: "TTS_END" });
    }
  }, [dispatch]);

  // マウント時に最初のassistantメッセージをTTS再生＋自動リスニング開始
  // 遷移元で prewarmAudioContext() 済みのため AudioContext は running 状態
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;

    const lastMsg = messagesRef.current[messagesRef.current.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    void speakAndAutoListen(lastMsg.content).catch(console.error);
  }, [speakAndAutoListen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsRef.current.stop();
      srRef.current.stop();
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  return {
    state,
    messages,
    currentTranscript,
    startListening,
    stopSpeaking,
    retry,
    errorMessage,
    isSupported: speechRecognition.isSupported,
    interviewStage,
    sessionId,
    reportData,
  };
}
