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
    <div className="rounded-[18px] bg-white pt-[10px] pb-3">
      {(currentTopic || showSkip || remainingMinutes != null) && (
        <div className="mb-2 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {currentTopic && (
              <div className="inline-flex max-w-full rounded-lg bg-gradient-to-br from-[#E2F6F3] to-[#EEF6E2] px-4 py-0.5">
                <p className="truncate text-sm font-bold leading-normal text-[#1F2937]">
                  {currentTopic}
                </p>
              </div>
            )}
            {showSkip && (
              <Button
                variant="link"
                onClick={onSkip}
                disabled={disabled}
                className="h-auto shrink-0 p-0 text-sm font-bold text-[#0F8472] no-underline hover:underline"
              >
                スキップする
              </Button>
            )}
          </div>
          {remainingMinutes != null && (
            <div className="ml-auto shrink-0">
              <InterviewTimer remainingMinutes={remainingMinutes} />
            </div>
          )}
        </div>
      )}
      <Progress
        value={percentage}
        className="h-[7px] rounded-full bg-[#D9D9D9] [&>[data-slot=progress-indicator]]:bg-[#2AA693]"
      />
    </div>
  );
}
