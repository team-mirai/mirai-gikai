"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";

interface NewInterviewButtonProps {
  billId: string;
  previewToken?: string;
}

export function NewInterviewButton({
  billId,
  previewToken,
}: NewInterviewButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    const chatLink = getInterviewChatLink(billId, previewToken);
    router.push(chatLink as Route);
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className="w-full bg-white border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4"
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Image
          src="/icons/messages-square-icon.svg"
          alt=""
          width={24}
          height={24}
          className="object-contain"
        />
      )}
      <span>{isLoading ? "処理中..." : "もう一度新たに回答する"}</span>
      {!isLoading && <ArrowRight className="size-4" />}
    </Button>
  );
}
