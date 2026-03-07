import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-32 w-full rounded-[1.5rem] border border-border bg-white/80 px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-forest/40 focus:ring-4 focus:ring-forest/10",
        className,
      )}
      {...props}
    />
  );
});
