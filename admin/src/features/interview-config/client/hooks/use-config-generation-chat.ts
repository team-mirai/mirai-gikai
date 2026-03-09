"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useCallback, useState } from "react";
import {
  type ConfigGenerationStage,
  configGenerationResponseSchema,
} from "../../shared/schemas";
import type { InterviewQuestionInput } from "../../shared/types";

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
  existingThemes?: string[];
  existingQuestions?: InterviewQuestionInput[];
  onThemesConfirmed: (themes: string[]) => void;
  onQuestionsConfirmed: (questions: InterviewQuestionInput[]) => void;
}

export function useConfigGenerationChat({
  billId,
  configId,
  existingThemes,
  existingQuestions,
  onThemesConfirmed,
  onQuestionsConfirmed,
}: UseConfigGenerationChatProps) {
  const hasExistingThemes = (existingThemes?.length ?? 0) > 0;
  const hasExistingQuestions = (existingQuestions?.length ?? 0) > 0;
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<ConfigGenerationStage>("theme_proposal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [confirmedThemes, setConfirmedThemes] = useState<string[]>([]);
  const [proposedThemes, setProposedThemes] = useState<string[]>([]);
  const [proposedQuestions, setProposedQuestions] = useState<
    InterviewQuestionInput[]
  >([]);

  const { object, submit, isLoading, error, stop } = useObject({
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
        existingThemes:
          apiStage === "theme_proposal" && hasExistingThemes
            ? existingThemes
            : undefined,
        existingQuestions:
          apiStage === "question_proposal" && hasExistingQuestions
            ? existingQuestions
            : undefined,
      });
    },
    [
      messages,
      billId,
      configId,
      stage,
      confirmedThemes,
      isLoading,
      submit,
      hasExistingThemes,
      existingThemes,
      hasExistingQuestions,
      existingQuestions,
    ]
  );

  const startGeneration = useCallback(() => {
    if (hasExistingThemes || hasExistingQuestions) {
      // 既存設定あり: ブラッシュアップモード
      const parts: string[] = [
        "インタビュー設定アシスタントです。現在の設定を確認しました。",
      ];
      if (hasExistingThemes) {
        parts.push(
          `\n\n**現在のテーマ（${existingThemes?.length}件）:**\n${existingThemes?.map((t) => `- ${t}`).join("\n")}`
        );
      }
      if (hasExistingQuestions) {
        parts.push(
          `\n\n**現在の質問（${existingQuestions?.length}件）:**\n${existingQuestions?.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}`
        );
      }
      parts.push(
        "\n\nどのようにブラッシュアップしますか？修正の要望をテキストで入力するか、バッジをクリックしてテーマ・質問の再生成ができます。"
      );
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: parts.join(""),
        },
      ]);
      // 既存設定がある場合は自動生成せず、ユーザーの指示を待つ
    } else {
      // 新規: 自動でテーマ提案
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content:
            "インタビュー設定アシスタントです。法案内容を分析して、テーマと質問を提案します。まずはテーマから始めますね。",
        },
      ]);
      submit({
        messages: [],
        billId,
        configId,
        stage: "theme_proposal",
      });
    }
  }, [
    billId,
    configId,
    submit,
    hasExistingThemes,
    hasExistingQuestions,
    existingThemes,
    existingQuestions,
  ]);

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
        existingQuestions: hasExistingQuestions ? existingQuestions : undefined,
      });
    },
    [
      billId,
      configId,
      messages,
      onThemesConfirmed,
      submit,
      hasExistingQuestions,
      existingQuestions,
    ]
  );

  const confirmQuestions = useCallback(
    (questions: InterviewQuestionInput[]) => {
      setStage("question_confirmed");
      onQuestionsConfirmed(questions);
    },
    [onQuestionsConfirmed]
  );

  const skipToQuestions = useCallback(
    (themes: string[]) => {
      if (isLoading) stop();

      setConfirmedThemes(themes);
      setStage("question_proposal");
      setProposedThemes([]);
      setProposedQuestions([]);

      const skipMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: "assistant",
        content:
          themes.length > 0
            ? "質問提案に移ります。フォームのテーマを使用します。"
            : "質問提案に移ります。法案内容から質問を提案します。",
      };
      setMessages((prev) => [...prev, skipMessage]);

      submit({
        messages: [],
        billId,
        configId,
        stage: "question_proposal",
        confirmedThemes: themes.length > 0 ? themes : undefined,
        existingQuestions: hasExistingQuestions ? existingQuestions : undefined,
      });
    },
    [
      billId,
      configId,
      isLoading,
      stop,
      submit,
      hasExistingQuestions,
      existingQuestions,
    ]
  );

  const switchToThemes = useCallback(() => {
    if (isLoading) stop();

    setStage("theme_proposal");
    setConfirmedThemes([]);
    setProposedThemes([]);
    setProposedQuestions([]);

    const switchMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      role: "assistant",
      content: "テーマ提案に戻ります。法案内容を分析してテーマを提案します。",
    };
    setMessages((prev) => [...prev, switchMessage]);

    submit({
      messages: [],
      billId,
      configId,
      stage: "theme_proposal",
      existingThemes: hasExistingThemes ? existingThemes : undefined,
    });
  }, [
    billId,
    configId,
    isLoading,
    stop,
    submit,
    hasExistingThemes,
    existingThemes,
  ]);

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
    skipToQuestions,
    switchToThemes,
  };
}
