"use client";

import { useState } from "react";
import {
  ChevronRight,
  CircleArrowRight,
  LogOut,
  MessageCircleMore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SkipActionPopoverProps {
  onSkipToNext: () => void;
  onEndInterview: () => void;
  disabled?: boolean;
}

export function SkipActionPopover({
  onSkipToNext,
  onEndInterview,
  disabled = false,
}: SkipActionPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleSkipToNext = () => {
    setOpen(false);
    onSkipToNext();
  };

  const handleEndInterview = () => {
    setOpen(false);
    onEndInterview();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className="h-auto gap-1 p-0 text-xs font-medium leading-[1.8] text-gray-400 hover:text-gray-600 hover:bg-transparent"
        >
          スキップする
          <ChevronRight className="size-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-auto rounded-2xl border border-gray-200 bg-white px-2 py-4 shadow-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 px-4">
            <Button
              variant="ghost"
              onClick={handleSkipToNext}
              className="h-auto justify-start gap-2 p-0 text-xs font-medium leading-[1.8] text-mirai-text hover:bg-transparent hover:opacity-70"
            >
              <CircleArrowRight className="size-5 shrink-0" />
              次の質問に進む
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-auto justify-start gap-2 p-0 text-xs font-medium leading-[1.8] text-mirai-text hover:bg-transparent hover:opacity-70"
            >
              <MessageCircleMore className="size-5 shrink-0" />
              他に言いたいことがある
            </Button>
          </div>
          <div className="border-t border-gray-200" />
          <div className="px-4">
            <Button
              variant="ghost"
              onClick={handleEndInterview}
              className="h-auto justify-start gap-2 p-0 text-xs font-medium leading-[1.8] text-mirai-text hover:bg-transparent hover:opacity-70"
            >
              <LogOut className="size-5 shrink-0" />
              インタビューを終了する
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
