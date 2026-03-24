"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArchiveAndNavigate } from "../hooks/use-archive-and-navigate";

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
  const { execute, isLoading } = useArchiveAndNavigate(
    sessionId,
    billId,
    previewToken
  );

  const handleClick = async () => {
    const confirmed = window.confirm(
      "現在の回答内容は破棄されます。最初からやり直しますか？"
    );
    if (!confirmed) return;
    await execute();
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      <RotateCcw className="size-4" />
      <span>{isLoading ? "処理中..." : "もう一度最初から回答する"}</span>
    </Button>
  );
}
