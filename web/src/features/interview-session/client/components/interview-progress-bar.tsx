"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InterviewTimer } from "./interview-timer";

interface InterviewProgressBarProps {
  percentage: number;
  currentTopic: string | null;
  showSkip: boolean;
  onSkip: () => void;
  disabled: boolean;
  remainingMinutes?: number | null;
}

export function InterviewProgressBar({
  percentage,
  currentTopic,
  showSkip,
  onSkip,
  disabled,
  remainingMinutes,
}: InterviewProgressBarProps) {
  return (
    <div className="rounded-[18px] bg-white py-[10px]">
      <Progress
        value={percentage}
        className="h-[7px] rounded-full bg-[#D9D9D9] [&>[data-slot=progress-indicator]]:bg-[#2AA693]"
      />
      {(currentTopic || showSkip || remainingMinutes != null) && (
        <div className="mt-3 flex items-center gap-2">
          {currentTopic ? (
            <p className="min-w-0 truncate text-sm font-bold leading-[1.8] text-[#1F2937]">
              {currentTopic}
            </p>
          ) : (
            <div className="flex-1" />
          )}
          {showSkip && (
            <Button
              variant="link"
              onClick={onSkip}
              disabled={disabled}
              className="h-auto shrink-0 p-0 text-sm font-bold text-[#0F8472] hover:no-underline"
            >
              スキップする
            </Button>
          )}
          {remainingMinutes != null && (
            <div className="ml-auto shrink-0">
              <InterviewTimer remainingMinutes={remainingMinutes} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
