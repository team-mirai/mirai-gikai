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

  const isHorizontal = replies.length >= 5;

  return (
    <div
      className={
        isHorizontal
          ? "flex flex-row flex-wrap justify-end gap-2 mt-2 ml-auto w-1/2"
          : "flex flex-col items-end gap-2 mt-2"
      }
    >
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium text-primary-accent border border-primary-accent rounded-full hover:bg-primary-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
