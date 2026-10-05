"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface StanceSupplementsProps {
  children: ReactNode;
}

/** 補足情報の開閉。初期状態は閉じる */
export function StanceSupplements({ children }: StanceSupplementsProps) {
  return (
    <Collapsible className="group flex flex-col border-t border-mirai-surface-tag pt-1">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto min-h-11 w-full justify-between rounded-none px-0 hover:bg-transparent"
        >
          <span className="text-[15px] font-bold text-mirai-text">
            補足情報
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-primary-accent">
            <span className="group-data-[state=open]:hidden">開く</span>
            <span className="hidden group-data-[state=open]:inline">
              閉じる
            </span>
            <ChevronDown className="size-3.5 stroke-[2.5] transition-transform group-data-[state=open]:rotate-180" />
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 pt-1.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
