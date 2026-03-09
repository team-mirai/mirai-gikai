"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { duplicateBill } from "../../../server/actions/duplicate-bill";

interface DuplicateBillButtonProps {
  billId: string;
  billName: string;
}

export function DuplicateBillButton({
  billId,
  billName,
}: DuplicateBillButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDuplicate = async () => {
    if (!confirm(`「${billName}」を複製しますか？`)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await duplicateBill(billId);

      if (!result.success) {
        toast.error("error" in result ? result.error : "複製に失敗しました");
      } else {
        toast.success("議案を複製しました");
      }
    } catch (error) {
      console.error("Error duplicating bill:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start font-normal h-8"
      onClick={handleDuplicate}
      disabled={isLoading}
    >
      <Copy className="mr-2 h-4 w-4" />
      {isLoading ? "複製中..." : "複製"}
    </Button>
  );
}
