"use client";

import { Mic, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InterviewCtaProps {
  billId: string;
  onDismiss?: () => void;
}

/**
 * Interview CTA component displayed in the chat window
 * when the user shows expertise or interest in sharing opinions
 */
export function InterviewCta({ billId, onDismiss }: InterviewCtaProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="relative bg-gradient-to-r from-[#E8F7F3] to-[#F0FAF7] border border-[#2AA693] rounded-xl p-4 my-2">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full transition-colors"
        aria-label="閉じる"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2AA693] flex items-center justify-center">
          <Mic className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1F2937] mb-1">
            AIインタビューに参加しませんか？
          </p>
          <p className="text-xs text-gray-600 mb-3">
            あなたの意見や経験を、AIインタビューで詳しくお聞かせください。いただいた意見は法案の議論に活かされます。
          </p>

          <Button asChild variant="default" size="sm" className="w-full">
            <Link href={`/bills/${billId}/interview`}>
              インタビューに参加する
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
