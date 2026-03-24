import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  showLabel?: boolean;
}

export function RatingStars({ rating, showLabel = false }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
      {showLabel && (
        <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
      )}
    </div>
  );
}
