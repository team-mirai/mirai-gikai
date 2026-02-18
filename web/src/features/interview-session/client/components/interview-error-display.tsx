"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterviewErrorDisplayProps {
  error: Error | null | undefined;
  canRetry: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}

export function InterviewErrorDisplay({
  error,
  canRetry,
  onRetry,
  isRetrying,
}: InterviewErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex gap-1 items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-500">{error?.message}</p>
        </div>
      </div>

      {canRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          size="sm"
        >
          {isRetrying ? "再試行中..." : "もう一度試す"}
        </Button>
      )}
    </div>
  );
}
