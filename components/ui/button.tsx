import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

const buttonStyles = {
  primary:
    "bg-forest text-white shadow-[0_14px_30px_rgba(47,87,37,0.22)] hover:bg-forest-soft",
  secondary:
    "border border-forest/20 bg-white/70 text-forest hover:border-forest/40 hover:bg-white",
  ghost: "bg-transparent text-ink hover:bg-white/60",
};

type ButtonVariant = keyof typeof buttonStyles;

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant;
  }) {
  return (
    <Link
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
});
