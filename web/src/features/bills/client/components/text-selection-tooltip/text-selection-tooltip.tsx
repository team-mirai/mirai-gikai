"use client";

import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTooltipPosition } from "../../hooks/use-tooltip-position";

interface TextSelectionTooltipProps {
  isVisible: boolean;
  selectedText: string;
  rect: DOMRect | null;
  onAskQuestion: (text: string) => void;
}

export function TextSelectionTooltip({
  isVisible,
  selectedText,
  rect,
  onAskQuestion,
}: TextSelectionTooltipProps) {
  const position = useTooltipPosition({ rect, isVisible });

  if (!isVisible || !rect) {
    return null;
  }

  const buttonSize = "text-xs h-11 !px-4";
  const iconSize = "h-3 w-3";

  return (
    <div
      className={`fixed z-10 bg-white border border-gray-200 rounded-md shadow-lg`}
      style={position}
    >
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAskQuestion(selectedText)}
          className={buttonSize}
        >
          <MessageCircleQuestion className={`mr-1 ${iconSize}`} />
          AIに質問
        </Button>
      </div>
    </div>
  );
}
