import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  suffix?: ReactNode;
};

export function Input({
  label,
  hint,
  suffix,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40",
            suffix && "pr-10",
            className,
          )}
          {...props}
        />
        {suffix ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {suffix}
          </div>
        ) : null}
      </div>
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ label, id, className, ...props }: TextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        id={inputId}
        className={cn(
          "min-h-24 w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40",
          className,
        )}
        {...props}
      />
    </label>
  );
}
