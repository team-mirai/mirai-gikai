"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useArchiveAndNavigate } from "../hooks/use-archive-and-navigate";

interface NewInterviewButtonProps {
  sessionId: string;
  billId: string;
  previewToken?: string;
}

export function NewInterviewButton({
  sessionId,
  billId,
  previewToken,
}: NewInterviewButtonProps) {
  const { execute, isLoading } = useArchiveAndNavigate(
    sessionId,
    billId,
    previewToken
  );

  return (
    <Button
      variant="outline"
      onClick={execute}
      disabled={isLoading}
      className="w-full bg-white border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4"
    >
      <Image
        src="/icons/messages-square-icon.svg"
        alt=""
        width={24}
        height={24}
        className="object-contain"
      />
      <span>{isLoading ? "処理中..." : "もう一度新たに回答する"}</span>
      <ArrowRight className="size-4" />
    </Button>
  );
}
