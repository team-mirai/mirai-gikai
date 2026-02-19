import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

interface VisibilityBadgeProps {
  isPublic: boolean;
}

export function VisibilityBadge({ isPublic }: VisibilityBadgeProps) {
  if (isPublic) {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 gap-1"
      >
        <Eye className="h-3 w-3" />
        公開
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-gray-50 text-gray-500 border-gray-200 gap-1"
    >
      <EyeOff className="h-3 w-3" />
      非公開
    </Badge>
  );
}
