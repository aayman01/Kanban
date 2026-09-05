import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

const variants: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-neutral-200 px-3",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-white/5 px-3",
  ghost: "text-muted-foreground hover:bg-white/5 hover:text-foreground px-3",
  destructive:
    "border border-border text-[#E07A5F] hover:bg-white/5 px-3",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-8 min-h-8 cursor-pointer items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
