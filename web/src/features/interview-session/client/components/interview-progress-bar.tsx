"use client";

import { Progress } from "@/components/ui/progress";
import { InterviewTimer } from "./interview-timer";

interface InterviewProgressBarProps {
  percentage: number;
  currentTopic: string | null;
  remainingMinutes?: number | null;
}

export function InterviewProgressBar({
  percentage,
  currentTopic,
  remainingMinutes,
}: InterviewProgressBarProps) {
  return (
    <div className="rounded-[18px] bg-white">
      {(currentTopic || remainingMinutes != null) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {currentTopic && (
              <div className="inline-flex max-w-full rounded-lg bg-mirai-light-gradient px-4 py-0.5">
                <p className="min-w-0 truncate text-sm font-bold leading-[1.8] text-mirai-text">
                  {currentTopic}
                </p>
              </div>
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
        className="h-[7px] rounded-full bg-mirai-progress-track [&>[data-slot=progress-indicator]]:bg-primary"
      />
    </div>
  );
}
