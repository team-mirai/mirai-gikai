"use client";

import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RestartInterviewButton } from "@/features/interview-session/client/components/restart-interview-button";
import { NewInterviewButton } from "@/features/interview-session/client/components/new-interview-button";
import type { LatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { InterviewConsentModal } from "./interview-consent-modal";

interface InterviewActionButtonsProps {
  billId: string;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
}

export function InterviewActionButtons({
  billId,
  sessionInfo,
  previewToken,
}: InterviewActionButtonsProps) {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const isActive = sessionInfo?.status === "active";
  const isCompleted = sessionInfo?.status === "completed";

  // 完了済みの場合：「もう一度新たに回答する」ボタン（確認ダイアログなし）
  if (isCompleted && sessionInfo?.reportId) {
    return <NewInterviewButton billId={billId} previewToken={previewToken} />;
  }

  // 進行中の場合は直接遷移
  if (isActive) {
    const chatLink = getInterviewChatLink(billId, previewToken);

    return (
      <>
        <Link href={chatLink as Route}>
          <Button className="w-full bg-mirai-gradient text-black border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4">
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
        </Link>
        <RestartInterviewButton
          sessionId={sessionInfo.id}
          billId={billId}
          previewToken={previewToken}
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
      />
    </>
  );
}
