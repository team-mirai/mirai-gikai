"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";

interface InterviewSessionErrorViewProps {
  billId: string;
  previewToken?: string;
  message?: string;
}

/**
 * インタビューセッションの初期化に失敗した際の表示
 */
export function InterviewSessionErrorView({
  billId,
  previewToken,
  message = "インタビューの開始または再開中に問題が発生しました。一度インタビューのトップ画面に戻ってから、再度お試しください。",
}: InterviewSessionErrorViewProps) {
  const lpLink = getInterviewLPLink(billId, previewToken);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">
            セッションを読み込めませんでした
          </h2>
          <p className="text-gray-600 text-center max-w-sm">{message}</p>
        </div>
      </div>

      <Link href={lpLink}>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-black rounded-[100px] font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          インタビュートップに戻る
        </Button>
      </Link>
    </div>
  );
}
