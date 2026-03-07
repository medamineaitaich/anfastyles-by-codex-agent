import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const active = rating >= index + 1;
        return (
          <Star
            key={index}
            className={cn("h-4 w-4", active ? "fill-clay text-clay" : "text-border")}
          />
        );
      })}
    </div>
  );
}
