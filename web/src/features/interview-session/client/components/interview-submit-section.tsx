"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getInterviewReportCompleteLink } from "@/features/interview-config/shared/utils/interview-links";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { updatePublicSetting } from "@/features/interview-report/server/actions/update-public-setting";

interface InterviewSubmitSectionProps {
  sessionId: string;
  reportId: string;
}

export function InterviewSubmitSection({
  sessionId,
  reportId,
}: InterviewSubmitSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (isPublic: boolean) => {
    setIsSubmitting(true);
    try {
      const result = await updatePublicSetting(sessionId, isPublic);
      if (result.success) {
        window.location.href = getInterviewReportCompleteLink(reportId);
      } else {
        console.error("Failed to update public setting:", result.error);
        setIsSubmitting(false);
      }
      // 画面遷移するまで isSubmitting を true のままにする
    } catch (err) {
      console.error("Failed to update public setting:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Button onClick={() => setIsModalOpen(true)}>
        インタビューの提出に進む
      </Button>
      <InterviewPublicConsentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
