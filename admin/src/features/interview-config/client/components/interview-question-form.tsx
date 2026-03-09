"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InterviewQuestionInput } from "../../shared/types";
import { arrayToText, textToArray } from "../../shared/types";

interface InterviewQuestionFormProps {
  onSubmit: (question: InterviewQuestionInput) => void;
  onCancel?: () => void;
  initialData?: InterviewQuestionInput;
  submitLabel?: string;
}

export function InterviewQuestionForm({
  onSubmit,
  onCancel,
  initialData,
  submitLabel = "追加",
}: InterviewQuestionFormProps) {
  const questionId = useId();
  const followUpGuideId = useId();
  const quickRepliesId = useId();
  const [question, setQuestion] = useState(initialData?.question || "");
  const [followUpGuide, setFollowUpGuide] = useState(
    initialData?.follow_up_guide || ""
  );
  const [quickRepliesText, setQuickRepliesText] = useState(
    arrayToText(initialData?.quick_replies)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    onSubmit({
      question: question.trim(),
      follow_up_guide: followUpGuide.trim() || undefined,
      quick_replies:
        quickRepliesText.trim() !== ""
          ? textToArray(quickRepliesText)
          : undefined,
    });

    // フォームをリセット
    setQuestion("");
    setFollowUpGuide("");
    setQuickRepliesText("");
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // フォームをリセット
      setQuestion("");
      setFollowUpGuide("");
      setQuickRepliesText("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border rounded-lg p-4 bg-gray-50"
    >
      <div className="space-y-2">
        <Label htmlFor={questionId}>
          質問文 <span className="text-red-500">*</span>
        </Label>
        <Input
          id={questionId}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="質問文を入力"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={followUpGuideId}>フォローアップ指針（任意）</Label>
        <Textarea
          id={followUpGuideId}
          value={followUpGuide}
          onChange={(e) => setFollowUpGuide(e.target.value)}
          placeholder="回答後の深掘り方法などの指針を入力"
          className="min-h-[80px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={quickRepliesId}>クイックリプライ（任意）</Label>
        <Textarea
          id={quickRepliesId}
          value={quickRepliesText}
          onChange={(e) => setQuickRepliesText(e.target.value)}
          placeholder="クイックリプライを改行区切りで入力（例：&#10;賛成&#10;反対&#10;どちらとも言えない）"
          className="min-h-[80px] resize-y"
        />
        <p className="text-sm text-gray-500">
          各クイックリプライを1行ずつ入力してください
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
