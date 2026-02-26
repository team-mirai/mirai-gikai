"use client";

import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExpertRegistrationBannerProps {
  onRegisterClick: () => void;
}

export function ExpertRegistrationBanner({
  onRegisterClick,
}: ExpertRegistrationBannerProps) {
  return (
    <div className="bg-mirai-light-gradient rounded-2xl p-6 flex flex-col gap-4">
      <Badge variant="light">法案の有識者の方へ</Badge>
      <h3 className="text-lg font-bold text-gray-800">
        有識者リストにご登録ください
      </h3>
      <p className="text-sm text-gray-800">
        現場の知見を法案に活かすため、登録をいただいた方には、今後チームみらいから追加のインタビューをお願いする場合があります。
      </p>
      <Button variant="outline" onClick={onRegisterClick} className="w-full">
        <MessageSquare className="size-5" />
        有識者リストに登録する
      </Button>
    </div>
  );
}
