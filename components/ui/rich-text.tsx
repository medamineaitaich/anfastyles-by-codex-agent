import { cn } from "@/lib/utils";

export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("prose-woo", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
