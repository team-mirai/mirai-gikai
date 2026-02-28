"use client";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { InterviewSessionStatus } from "../../server/loaders/get-latest-interview-session";

const interviewStatusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded px-3 py-1 text-sm font-medium",
  {
    variants: {
      status: {
        active: "bg-mirai-badge-yellow text-black",
        completed: "bg-mirai-gradient text-black",
      },
    },
  }
);

const statusLabels: Record<Exclude<InterviewSessionStatus, "none">, string> = {
  active: "中断中",
  completed: "回答完了",
};

interface InterviewStatusBadgeProps {
  status: InterviewSessionStatus;
  className?: string;
}

export function InterviewStatusBadge({
  status,
  className,
}: InterviewStatusBadgeProps) {
  if (status === "none") {
    return null;
  }

  return (
    <span className={cn(interviewStatusBadgeVariants({ status }), className)}>
      {statusLabels[status]}
    </span>
  );
}
