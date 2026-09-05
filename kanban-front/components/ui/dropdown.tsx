"use client";

import { cn } from "@/lib/cn";
import { MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Item = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

type Props = {
  label: string;
  items: Item[];
  align?: "left" | "right";
  trigger?: ReactNode;
  className?: string;
};

export function Dropdown({
  label,
  items,
  align = "right",
  trigger,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
          trigger ? "min-h-8 px-2" : "size-8",
          className,
        )}
      >
        {trigger ?? <MoreHorizontal strokeWidth={1.5} className="size-4" />}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full z-30 min-w-40 rounded-xl bg-card py-1",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={cn(
                "flex min-h-9 w-full items-center px-3 text-left text-sm hover:bg-muted",
                item.destructive ? "text-[#E07A5F]" : "text-foreground",
              )}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
