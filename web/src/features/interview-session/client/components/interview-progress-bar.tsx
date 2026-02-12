"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface InterviewProgressBarProps {
  completedCount: number;
  totalCount: number;
  currentTopic: string | null;
  onSkip: () => void;
  disabled: boolean;
}

export function InterviewProgressBar({
  completedCount,
  totalCount,
  currentTopic,
  onSkip,
  disabled,
}: InterviewProgressBarProps) {
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-[18px] bg-white py-[10px]">
      <Progress
        value={percentage}
        className="h-[7px] rounded-full bg-[#D9D9D9] [&>[data-slot=progress-indicator]]:bg-[#2AA693]"
      />
      <div className="mt-3 flex items-center justify-between gap-6">
        {currentTopic ? (
          <p className="min-w-0 flex-1 truncate text-sm font-bold leading-[1.8] text-[#1F2937]">
            {currentTopic}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <Button
          variant="link"
          onClick={onSkip}
          disabled={disabled}
          className="h-auto shrink-0 p-0 text-sm font-bold text-[#0F8472] hover:no-underline"
        >
          スキップする
        </Button>
      </div>
    </div>
  );
}
