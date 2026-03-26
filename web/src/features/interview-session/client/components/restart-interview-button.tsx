"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useArchiveAndNavigate } from "../hooks/use-archive-and-navigate";
import { RestartConfirmDialog } from "./restart-confirm-dialog";

interface RestartInterviewButtonProps {
  sessionId: string;
  billId: string;
  previewToken?: string;
}

export function RestartInterviewButton({
  sessionId,
  billId,
  previewToken,
}: RestartInterviewButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { execute, isLoading } = useArchiveAndNavigate(
    sessionId,
    billId,
    previewToken
  );

  const handleConfirm = async () => {
    await execute();
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
      >
        <RotateCcw className="size-4" />
        <span>もう一度最初から回答する</span>
      </Button>
      <RestartConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
