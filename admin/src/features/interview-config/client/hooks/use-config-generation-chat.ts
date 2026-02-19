"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useCallback, useState } from "react";
import {
  type ConfigGenerationStage,
  configGenerationResponseSchema,
} from "../../shared/schemas";
import type { InterviewQuestionInput } from "../../types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  themes?: string[];
  questions?: InterviewQuestionInput[];
}

interface UseConfigGenerationChatProps {
  billId: string;
  configId?: string;
  onThemesConfirmed: (themes: string[]) => void;
  onQuestionsConfirmed: (questions: InterviewQuestionInput[]) => void;
}

export function useConfigGenerationChat({
  billId,
  configId,
  onThemesConfirmed,
  onQuestionsConfirmed,
}: UseConfigGenerationChatProps) {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<ConfigGenerationStage>("theme_proposal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [confirmedThemes, setConfirmedThemes] = useState<string[]>([]);
  const [proposedThemes, setProposedThemes] = useState<string[]>([]);
  const [proposedQuestions, setProposedQuestions] = useState<
    InterviewQuestionInput[]
  >([]);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/interview-config/generate",
    schema: configGenerationResponseSchema,
    onFinish: ({ object: finishedObject, error: finishedError }) => {
      if (finishedError || !finishedObject) return;

      const { text, themes, questions } = finishedObject;

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: text ?? "",
          themes: themes ?? undefined,
          questions: questions as InterviewQuestionInput[] | undefined,
        },
      ]);

      if (themes && themes.length > 0) {
        setProposedThemes(themes);
      }
      if (questions && questions.length > 0) {
        setProposedQuestions(questions as InterviewQuestionInput[]);
      }
    },
  });

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // 修正要望後はproposedをリセット
      setProposedThemes([]);
      setProposedQuestions([]);

      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];

      const apiStage =
        stage === "theme_confirmed" || stage === "question_proposal"
          ? "question_proposal"
          : "theme_proposal";

      submit({
        messages: apiMessages,
        billId,
        configId,
        stage: apiStage,
        confirmedThemes:
          apiStage === "question_proposal" ? confirmedThemes : undefined,
      });
    },
    [messages, billId, configId, stage, confirmedThemes, isLoading, submit]
  );

  const startGeneration = useCallback(() => {
    submit({
      messages: [],
      billId,
      configId,
      stage: "theme_proposal",
    });
  }, [billId, configId, submit]);

  const confirmThemes = useCallback(
    (themes: string[]) => {
      setConfirmedThemes(themes);
      setStage("theme_confirmed");
      onThemesConfirmed(themes);

      // テーマ確定メッセージを追加
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: "assistant",
        content:
          "テーマを確定しました。次に、テーマに基づいた質問を提案します。",
      };
      setMessages((prev) => [...prev, systemMessage]);
      setProposedThemes([]);
      setProposedQuestions([]);

      // 質問提案フェーズへ移行
      setStage("question_proposal");

      submit({
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        billId,
        configId,
        stage: "question_proposal",
        confirmedThemes: themes,
      });
    },
    [billId, configId, messages, onThemesConfirmed, submit]
  );

  const confirmQuestions = useCallback(
    (questions: InterviewQuestionInput[]) => {
      setStage("question_confirmed");
      onQuestionsConfirmed(questions);
    },
    [onQuestionsConfirmed]
  );

  return {
    input,
    setInput,
    stage,
    messages,
    isLoading,
    error,
    object,
    proposedThemes,
    proposedQuestions,
    startGeneration,
    handleSubmit,
    confirmThemes,
    confirmQuestions,
  };
}
