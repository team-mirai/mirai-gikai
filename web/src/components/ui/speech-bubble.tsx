import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SpeechBubbleProps extends HTMLAttributes<HTMLDivElement> {
  tailPosition?: "top" | "bottom" | "left" | "right";
  tailAlign?: "start" | "center" | "end";
}

const SpeechBubble = forwardRef<HTMLDivElement, SpeechBubbleProps>(
  (
    {
      className,
      children,
      tailPosition = "bottom",
      tailAlign = "center",
      ...props
    },
    ref
  ) => {
    // しっぽのスタイル（三角形）
    const tailBaseClasses =
      "after:content-[''] after:absolute after:border-transparent";

    // 位置とアラインメントに応じたクラス
    const positionClasses = {
      top: cn(
        "after:bottom-full after:border-b-white after:border-x-[14px] after:border-b-[20px]",
        tailAlign === "center" && "after:left-1/2 after:-translate-x-1/2",
        tailAlign === "start" && "after:left-6",
        tailAlign === "end" && "after:right-6"
      ),
      bottom: cn(
        "after:top-full after:border-t-white after:border-x-[14px] after:border-t-[20px]",
        tailAlign === "center" && "after:left-1/2 after:-translate-x-1/2",
        tailAlign === "start" && "after:left-6",
        tailAlign === "end" && "after:right-6"
      ),
      left: cn(
        "after:right-full after:border-r-white after:border-y-[14px] after:border-r-[20px]",
        tailAlign === "center" && "after:top-1/2 after:-translate-y-1/2",
        tailAlign === "start" && "after:top-6",
        tailAlign === "end" && "after:bottom-6"
      ),
      right: cn(
        "after:left-full after:border-l-white after:border-y-[14px] after:border-l-[20px]",
        tailAlign === "center" && "after:top-1/2 after:-translate-y-1/2",
        tailAlign === "start" && "after:top-6",
        tailAlign === "end" && "after:bottom-6"
      ),
    }[tailPosition];

    return (
      <div
        ref={ref}
        className={cn(
          "relative bg-white rounded-[24px] px-8 py-10",
          tailBaseClasses,
          positionClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SpeechBubble.displayName = "SpeechBubble";

export { SpeechBubble };
