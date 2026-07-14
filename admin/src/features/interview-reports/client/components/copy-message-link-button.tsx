"use client";

import { Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMessageAnchorId } from "../../shared/utils/message-anchor";

interface CopyMessageLinkButtonProps {
  messageId: string;
}

export function CopyMessageLinkButton({
  messageId,
}: CopyMessageLinkButtonProps) {
  const handleClick = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${getMessageAnchorId(messageId)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("メッセージへのリンクをコピーしました");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `リンクのコピーに失敗しました: ${error.message}`
          : "リンクのコピーに失敗しました"
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-6 w-6 text-gray-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      title="このメッセージへのリンクをコピー"
      aria-label="このメッセージへのリンクをコピー"
    >
      <LinkIcon className="size-3.5" />
    </Button>
  );
}
