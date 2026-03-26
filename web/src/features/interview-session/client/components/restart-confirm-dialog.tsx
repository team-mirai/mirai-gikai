"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RestartConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function RestartConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RestartConfirmDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="px-8 py-12">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary text-center">
            最初からやり直しますか？
          </DialogTitle>
          <div className="h-[1px] bg-mirai-gradient mt-6" />
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-6">
          <p className="text-sm font-bold text-gray-800 leading-[22px] text-center">
            現在の回答内容は破棄されます。
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <Button onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 size-4" />
                最初からやり直す
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="w-full"
          >
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
