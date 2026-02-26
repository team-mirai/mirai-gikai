"use client";

import { useState } from "react";
import { ExpertRegistrationBanner } from "./expert-registration-banner";
import { ExpertRegistrationModal } from "./expert-registration-modal";

interface ExpertRegistrationSectionProps {
  sessionId: string;
}

export function ExpertRegistrationSection({
  sessionId,
}: ExpertRegistrationSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  if (isRegistered) {
    return null;
  }

  return (
    <>
      <ExpertRegistrationBanner onRegisterClick={() => setIsModalOpen(true)} />
      <ExpertRegistrationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        sessionId={sessionId}
        onRegistered={() => setIsRegistered(true)}
      />
    </>
  );
}
