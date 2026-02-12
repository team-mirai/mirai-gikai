"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InterviewPublicConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (isPublic: boolean) => void;
  isSubmitting: boolean;
}

function CheckListItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Image
        src="/icons/check-circle.svg"
        alt=""
        width={20}
        height={20}
        className="flex-shrink-0 mt-0.5"
      />
      <p className="text-sm font-medium leading-relaxed">{children}</p>
    </div>
  );
}

export function InterviewPublicConsentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: InterviewPublicConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md py-9">
        <DialogHeader>
          <p className="text-center text-primary-accent font-bold">
            あと少しです！
          </p>
          <DialogTitle className="text-[22px] font-bold text-center">
            公開設定
          </DialogTitle>
          <div className="h-[1px] bg-mirai-gradient mt-4" />
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <h3 className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            インタビュー内容の公開を
            <br />
            許可しますか
          </h3>

          <div className="space-y-4">
            <CheckListItem>
              公開を許可した場合、今後みらい議会にあなたのご意見が匿名で掲載されることがあります。
            </CheckListItem>
            <CheckListItem>
              さまざまな当事者の意見が公開されることで、より深い法案議論が実現できます。
            </CheckListItem>
          </div>

          <p className="text-sm text-black">
            非公開で提出した場合でも、ご意見は党内での政策検討に活用させていただきます。
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={() => onSubmit(true)}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "送信中..." : "公開を許可して提出する"}
            {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onSubmit(false)}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            非公開で提出する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
