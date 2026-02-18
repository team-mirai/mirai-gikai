"use client";

import type { ReactNode } from "react";
import { ArrowRight, LockOpen } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MakePublicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
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

export function MakePublicModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: MakePublicModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md py-9">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            インタビュー内容を
            <br />
            公開に切り替えますか？
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <CheckListItem>
            公開を許可した場合、今後みらい議会にあなたのご意見が匿名で掲載されることがあります。
          </CheckListItem>
          <CheckListItem>
            さまざまな当事者の意見が公開されることで、より深い法案議論が実現できます。
          </CheckListItem>
          <p className="text-sm text-black">
            非公開で提出した場合でも、ご意見は党内での政策検討に活用させていただきます。
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full"
          >
            <LockOpen className="mr-2 size-5" />
            {isSubmitting ? "変更中..." : "公開にする"}
            {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            非公開のまま戻る
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
