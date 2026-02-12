"use client";

import type { ReactNode } from "react";
import { ArrowRight, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MakePrivateModalProps {
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

export function MakePrivateModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: MakePrivateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm py-9">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            インタビュー内容を
            <br />
            非公開に切り替えますか？
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <CheckListItem>
            非公開にした場合、あなたのご意見が世の中に公開されることはありません
          </CheckListItem>
          <CheckListItem>
            チームみらい党内での政策検討に最大限活用させていただきます。
          </CheckListItem>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            variant="outline"
            className="w-full"
          >
            <Lock className="mr-2 size-5" />
            {isSubmitting ? "変更中..." : "非公開にする"}
            {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            公開のまま戻る
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
