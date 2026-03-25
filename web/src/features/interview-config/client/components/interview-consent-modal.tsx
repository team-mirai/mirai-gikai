"use client";

import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";

interface InterviewConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  previewToken?: string;
}

export function InterviewConsentModal({
  open,
  onOpenChange,
  billId,
  previewToken,
}: InterviewConsentModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (!agreed) return;
    setIsLoading(true);
    const destination = getInterviewChatLink(billId, previewToken);
    router.push(destination as Route);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAgreed(false);
      setIsLoading(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="px-8 py-12">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary text-center">
            AIインタビュー同意事項
          </DialogTitle>
          <div className="h-[1px] bg-mirai-gradient mt-6" />
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-6">
          <ul className="flex flex-col gap-3 list-disc pl-5 text-sm font-bold text-gray-800 leading-[22px]">
            <li>回答データは党内での政策検討に利用します。</li>
            <li>
              インタビューの回答内容の公開を許可した場合、のちにみらい議会上に掲載される場合があります。
            </li>
            <li>個人情報や機密情報の記載はお控えください</li>
          </ul>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="consent-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="size-4 shrink-0 rounded accent-primary"
            />
            <label
              htmlFor="consent-agree"
              className="text-sm font-bold text-black"
            >
              <Link
                href={routes.terms()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                利用規約
              </Link>
              と
              <Link
                href={routes.privacy()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                プライバシーポリシー
              </Link>
              に同意する
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <Button
            onClick={handleAgree}
            disabled={isLoading || !agreed}
            className="w-full"
          >
            同意してはじめる
            <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="w-full"
          >
            同意せずに戻る
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
