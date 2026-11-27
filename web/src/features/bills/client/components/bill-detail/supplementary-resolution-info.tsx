"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * 「附帯決議とは」の説明。PC はホバー、スマホはタップで開く
 */
export function SupplementaryResolutionInfo() {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="附帯決議とは"
          className="size-7 cursor-help hover:bg-transparent"
          onClick={() => setOpen(true)}
        >
          <Info className="size-[18px] text-mirai-text-muted" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        className="w-65 rounded-lg bg-mirai-text px-3 py-2.5 text-[13px] font-medium leading-[1.7] text-white"
      >
        附帯決議は、法律を運用するうえで気をつけてほしいことを、委員会が政府に求める決議です。
      </TooltipContent>
    </Tooltip>
  );
}
