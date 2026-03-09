"use client";

import { useState } from "react";
import { ExpertRegistrationBanner } from "./expert-registration-banner";
import { ExpertRegistrationModal } from "./expert-registration-modal";

export function ExpertRegistrationSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  return (
    <>
      {!isRegistered && (
        <ExpertRegistrationBanner
          onRegisterClick={() => setIsModalOpen(true)}
        />
      )}
      <ExpertRegistrationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRegistered={() => setIsRegistered(true)}
      />
    </>
  );
}
