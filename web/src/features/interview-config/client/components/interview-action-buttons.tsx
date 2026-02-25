"use client";

import { ArrowRight, FileText, MessageSquare, Mic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RestartInterviewButton } from "@/features/interview-session/client/components/restart-interview-button";
import type { LatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import {
  getInterviewChatLink,
  getInterviewReportCompleteLink,
} from "@/features/interview-config/shared/utils/interview-links";
import { InterviewConsentModal } from "./interview-consent-modal";

interface InterviewActionButtonsProps {
  billId: string;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
  voiceEnabled?: boolean;
}

export function InterviewActionButtons({
  billId,
  sessionInfo,
  previewToken,
  voiceEnabled,
}: InterviewActionButtonsProps) {
  const router = useRouter();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showResumeMode, setShowResumeMode] = useState(false);
  const isActive = sessionInfo?.status === "active";
  const isCompleted = sessionInfo?.status === "completed";

  const handleSelectResumeMode = (mode?: "voice") => {
    router.push(getInterviewChatLink(billId, previewToken, mode));
  };

  // 完了済みでレポートがある場合
  if (isCompleted && sessionInfo?.reportId) {
    return (
      <>
        <Link href={getInterviewReportCompleteLink(sessionInfo.reportId)}>
          <Button className="w-full bg-mirai-gradient text-black border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4">
            <FileText className="size-5" />
            <span>インタビューレポートを確認する</span>
            <ArrowRight className="size-5" />
          </Button>
        </Link>
        <RestartInterviewButton
          sessionId={sessionInfo.id}
          billId={billId}
          previewToken={previewToken}
          voiceEnabled={voiceEnabled}
        />
      </>
    );
  }

  // 進行中の場合
  if (isActive) {
    // 音声対応の場合はモード選択を表示
    if (voiceEnabled && showResumeMode) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <p className="text-sm text-muted-foreground text-center">
            回答方法を選んでください
          </p>
          <Button
            variant="outline"
            onClick={() => handleSelectResumeMode()}
            className="w-full h-14 flex items-center justify-center gap-3"
          >
            <MessageSquare className="size-5" />
            <div className="text-left">
              <div className="font-bold text-sm">テキストで再開する</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSelectResumeMode("voice")}
            className="w-full h-14 flex items-center justify-center gap-3"
          >
            <Mic className="size-5" />
            <div className="text-left">
              <div className="font-bold text-sm">音声で再開する</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowResumeMode(false)}
            className="w-full text-sm"
          >
            戻る
          </Button>
        </div>
      );
    }

    const handleResumeClick = () => {
      if (voiceEnabled) {
        setShowResumeMode(true);
      } else {
        router.push(getInterviewChatLink(billId, previewToken));
      }
    };

    return (
      <>
        <Button
          onClick={handleResumeClick}
          className="w-full bg-mirai-gradient text-black border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4"
        >
          <Image
            src="/icons/messages-square-icon.svg"
            alt=""
            width={24}
            height={24}
            className="object-contain"
          />
          <span>AIインタビューを再開する</span>
          <ArrowRight className="size-5" />
        </Button>
        <RestartInterviewButton
          sessionId={sessionInfo.id}
          billId={billId}
          previewToken={previewToken}
          voiceEnabled={voiceEnabled}
        />
      </>
    );
  }

  // 新規の場合はモーダルを表示
  return (
    <>
      <Button
        onClick={() => setShowConsentModal(true)}
        className="w-full bg-mirai-gradient text-black border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4"
      >
        <Image
          src="/icons/messages-square-icon.svg"
          alt=""
          width={24}
          height={24}
          className="object-contain"
        />
        <span>AIインタビューをはじめる</span>
        <ArrowRight className="size-5" />
      </Button>

      <InterviewConsentModal
        open={showConsentModal}
        onOpenChange={setShowConsentModal}
        billId={billId}
        previewToken={previewToken}
        voiceEnabled={voiceEnabled}
      />
    </>
  );
}
