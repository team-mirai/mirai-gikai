"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePublicSetting } from "../../server/actions/update-public-setting";
import { MakePrivateModal } from "./make-private-modal";
import { MakePublicModal } from "./make-public-modal";

interface PublicStatusSectionProps {
  sessionId: string;
  initialIsPublic: boolean;
}

export function PublicStatusSection({
  sessionId,
  initialIsPublic,
}: PublicStatusSectionProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePublicStatus = async () => {
    setIsSubmitting(true);
    try {
      const newStatus = !isPublic;
      const result = await updatePublicSetting(sessionId, newStatus);
      if (result.success) {
        setIsPublic(newStatus);
        setIsModalOpen(false);
      } else {
        console.error("Failed to update public setting:", result.error);
      }
    } catch (err) {
      console.error("Failed to update public setting:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {isPublic ? (
          <span className="inline-flex items-center gap-1 bg-mirai-gradient text-black text-sm font-bold px-4 py-1.5 rounded-full">
            公開
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 text-sm font-bold px-4 py-1.5 rounded-full">
            非公開
          </span>
        )}
        <Button
          variant="link"
          onClick={() => setIsModalOpen(true)}
          className={`text-sm ${isPublic ? "text-gray-500" : "text-primary-accent"}`}
        >
          {isPublic ? "非公開に変更する" : "公開に変更する"}
        </Button>
      </div>

      {isPublic ? (
        <MakePrivateModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onConfirm={handleChangePublicStatus}
          isSubmitting={isSubmitting}
        />
      ) : (
        <MakePublicModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onConfirm={handleChangePublicStatus}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
