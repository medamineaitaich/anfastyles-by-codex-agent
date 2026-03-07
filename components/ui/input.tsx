import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-forest/40 focus:ring-4 focus:ring-forest/10",
          className,
        )}
        {...props}
      />
    );
  },
);
