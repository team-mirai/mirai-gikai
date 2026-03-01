import Image from "next/image";
import { cn } from "@/lib/utils";
import { stanceLabels, stanceTextColors } from "../constants";

interface StanceDisplayProps {
  stance: string;
  size?: "sm" | "md";
}

export function StanceDisplay({ stance, size = "md" }: StanceDisplayProps) {
  const iconSize = size === "sm" ? 32 : 48;
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        src={`/icons/stance-${stance}.png`}
        alt={stanceLabels[stance] || stance}
        width={iconSize}
        height={iconSize}
        className="rounded-full"
      />
      <p className={cn(textSize, "font-bold", stanceTextColors[stance])}>
        {stanceLabels[stance] || stance}
      </p>
    </div>
  );
}
