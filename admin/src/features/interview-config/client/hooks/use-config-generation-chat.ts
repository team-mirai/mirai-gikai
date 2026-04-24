"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useCallback, useState } from "react";
import {
  type ConfigGenerationStage,
  configGenerationResponseSchema,
} from "../../shared/schemas";
import type { InterviewQuestionInput } from "../../shared/types";
import { buildQuestionsFromTemplate } from "../../shared/utils/default-questions-template";

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

/** サーバー側に送る stage（クライアント内部の確定状態は送らない） */
type ServerStage = "default_questions" | "question_proposal" | "theme_proposal";

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
  // 初期 stage は「ブラッシュアップ」か「新規」かで異なる
  const [stage, setStage] = useState<ConfigGenerationStage>(
    hasExistingQuestions ? "question_proposal" : "default_questions"
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [confirmedQuestions, setConfirmedQuestions] = useState<
    InterviewQuestionInput[]
  >([]);
  const [proposedThemes, setProposedThemes] = useState<string[]>([]);
  const [proposedQuestions, setProposedQuestions] = useState<
    InterviewQuestionInput[]
  >([]);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/interview-config/generate",
    schema: configGenerationResponseSchema,
    onFinish: ({ object: finishedObject, error: finishedError }) => {
      if (finishedError || !finishedObject) return;

      const { text, themes, questions, topics, stance } = finishedObject;

      // default_questions ステージ: テンプレと合成して proposedQuestions に
      if (topics || stance) {
        const merged = buildQuestionsFromTemplate({
          topics: topics as string[] | undefined,
          stance: stance as string[] | undefined,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: text ?? "",
            questions: merged,
          },
        ]);
        setProposedQuestions(merged);
        return;
      }

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

  /** 現在のクライアント stage からサーバー送信用 stage を決める */
  const resolveServerStage = useCallback(
    (current: ConfigGenerationStage): ServerStage => {
      if (current === "default_questions") return "default_questions";
      if (current === "theme_proposal" || current === "theme_confirmed") {
        return "theme_proposal";
      }
      return "question_proposal";
    },
    []
  );

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

      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];

      // default_questions で自由入力が来たら質問ブラッシュアップへ移行
      // theme_confirmed で自由入力が来たらテーマ提案に戻す
      const serverStage: ServerStage =
        stage === "default_questions"
          ? "question_proposal"
          : resolveServerStage(stage);

      if (stage === "default_questions") {
        setStage("question_proposal");
      } else if (stage === "theme_confirmed") {
        setStage("theme_proposal");
      }

      // 質問ブラッシュアップ時は、現在画面に表示中の質問を優先してコンテキストに渡す
      const questionContext =
        proposedQuestions.length > 0
          ? proposedQuestions
          : hasExistingQuestions
            ? existingQuestions
            : undefined;

      // 修正要望後は proposed をリセット（コンテキストは上で確保済み）
      setProposedThemes([]);
      setProposedQuestions([]);

      submit({
        messages: apiMessages,
        billId,
        configId,
        stage: serverStage,
        existingThemes:
          serverStage === "theme_proposal" && hasExistingThemes
            ? existingThemes
            : undefined,
        existingQuestions:
          serverStage === "question_proposal" ? questionContext : undefined,
        confirmedQuestions:
          serverStage === "theme_proposal" && confirmedQuestions.length > 0
            ? confirmedQuestions
            : undefined,
      });
    },
    [
      messages,
      billId,
      configId,
      stage,
      isLoading,
      submit,
      resolveServerStage,
      hasExistingThemes,
      existingThemes,
      hasExistingQuestions,
      existingQuestions,
      confirmedQuestions,
      proposedQuestions,
    ]
  );

  const startGeneration = useCallback(() => {
    if (hasExistingQuestions || hasExistingThemes) {
      // 既存設定あり: ブラッシュアップモード
      const parts: string[] = [
        "インタビュー設定アシスタントです。現在の設定を確認しました。",
      ];
      if (hasExistingQuestions) {
        parts.push(
          `\n\n**現在の質問（${existingQuestions?.length}件）:**\n${existingQuestions?.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}`
        );
      }
      if (hasExistingThemes) {
        parts.push(
          `\n\n**現在のテーマ（${existingThemes?.length}件）:**\n${existingThemes?.map((t) => `- ${t}`).join("\n")}`
        );
      }
      parts.push(
        "\n\nどのようにブラッシュアップしますか？修正の要望をテキストで入力するか、バッジをクリックしてテーマ側に切り替えられます。"
      );
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: parts.join(""),
        },
      ]);
      return;
    }

    // 新規: テンプレ + LLMでQ1/Q2を生成
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content:
          "インタビュー設定アシスタントです。法案内容を分析して、デフォルトの質問セットを準備します。",
      },
    ]);
    submit({
      messages: [],
      billId,
      configId,
      stage: "default_questions",
    });
  }, [
    billId,
    configId,
    submit,
    hasExistingThemes,
    hasExistingQuestions,
    existingThemes,
    existingQuestions,
  ]);

  const confirmQuestions = useCallback(
    (questions: InterviewQuestionInput[]) => {
      if (isLoading) stop();
      setConfirmedQuestions(questions);
      setStage("theme_proposal");
      setProposedQuestions([]);
      setProposedThemes([]);

      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: "assistant",
        content:
          "質問を確定しました。次に、この質問内容に沿ったテーマを提案します。",
      };
      setMessages((prev) => [...prev, systemMessage]);

      onQuestionsConfirmed(questions);

      submit({
        messages: [],
        billId,
        configId,
        stage: "theme_proposal",
        confirmedQuestions: questions,
        existingThemes: hasExistingThemes ? existingThemes : undefined,
      });
    },
    [
      billId,
      configId,
      isLoading,
      stop,
      submit,
      onQuestionsConfirmed,
      hasExistingThemes,
      existingThemes,
    ]
  );

  const confirmThemes = useCallback(
    (themes: string[]) => {
      setStage("theme_confirmed");
      onThemesConfirmed(themes);
    },
    [onThemesConfirmed]
  );

  /** 質問生成に戻る（テーマステージから） */
  const switchToQuestions = useCallback(() => {
    if (isLoading) stop();
    setStage("question_proposal");
    setProposedThemes([]);
    setProposedQuestions([]);

    const switchMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      role: "assistant",
      content: "質問のブラッシュアップに戻ります。修正要望を入力してください。",
    };
    setMessages((prev) => [...prev, switchMessage]);
  }, [isLoading, stop]);

  /** テーマ提案をスキップ（質問ステージから直接移動） */
  const skipToThemes = useCallback(() => {
    if (isLoading) stop();

    // 現在提示中の質問があればそれを確定扱いに
    const questionsToUse =
      proposedQuestions.length > 0
        ? proposedQuestions
        : confirmedQuestions.length > 0
          ? confirmedQuestions
          : (existingQuestions ?? []);

    if (questionsToUse.length > 0) {
      setConfirmedQuestions(questionsToUse);
    }

    setStage("theme_proposal");
    setProposedThemes([]);

    const skipMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      role: "assistant",
      content: "テーマ提案に移ります。",
    };
    setMessages((prev) => [...prev, skipMessage]);

    submit({
      messages: [],
      billId,
      configId,
      stage: "theme_proposal",
      confirmedQuestions:
        questionsToUse.length > 0 ? questionsToUse : undefined,
      existingThemes: hasExistingThemes ? existingThemes : undefined,
    });
  }, [
    billId,
    configId,
    isLoading,
    stop,
    submit,
    proposedQuestions,
    confirmedQuestions,
    existingQuestions,
    hasExistingThemes,
    existingThemes,
  ]);

  /** 生成中のストリームを停止する */
  const stopGeneration = useCallback(() => {
    if (isLoading) stop();
  }, [isLoading, stop]);

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
    stopGeneration,
    handleSubmit,
    confirmQuestions,
    confirmThemes,
    switchToQuestions,
    skipToThemes,
  };
}
