"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewQuestionInput,
} from "../../types";
import { InterviewConfigForm } from "../../components/interview-config-form";
import { InterviewQuestionList } from "../../components/interview-question-list";
import { ConfigGenerationChat } from "./config-generation-chat";

interface InterviewConfigEditClientProps {
  billId: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
}

export function InterviewConfigEditClient({
  billId,
  config,
  questions,
}: InterviewConfigEditClientProps) {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [aiGeneratedThemes, setAiGeneratedThemes] = useState<string[] | null>(
    null
  );
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<
    InterviewQuestionInput[] | null
  >(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!isAiPanelOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAiPanelOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AIで設定を生成
          </Button>
        )}
      </div>

      <InterviewConfigForm
        billId={billId}
        config={config}
        aiGeneratedThemes={aiGeneratedThemes}
        onAiThemesApplied={() => setAiGeneratedThemes(null)}
      />
      <InterviewQuestionList
        interviewConfigId={config.id}
        questions={questions}
        aiGeneratedQuestions={aiGeneratedQuestions}
        onAiQuestionsApplied={() => setAiGeneratedQuestions(null)}
      />

      <ConfigGenerationChat
        open={isAiPanelOpen}
        onOpenChange={setIsAiPanelOpen}
        billId={billId}
        configId={config.id}
        onThemesConfirmed={(themes) => {
          setAiGeneratedThemes(themes);
        }}
        onQuestionsConfirmed={(questions) => {
          setAiGeneratedQuestions(questions);
        }}
      />
    </div>
  );
}
