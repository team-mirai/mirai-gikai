"use client";

interface QuickReplyButtonsProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export function QuickReplyButtons({
  replies,
  onSelect,
  disabled = false,
}: QuickReplyButtonsProps) {
  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2 mt-2">
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium text-[#0F8472] border border-[#0F8472] rounded-full hover:bg-[#0F8472]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
