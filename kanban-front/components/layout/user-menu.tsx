"use client";

import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  const part = local.split(/[._-]/).filter(Boolean)[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
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

  if (!user) return null;

  const name = displayNameFromEmail(user.email);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 items-center justify-center rounded-full hover:bg-white/5"
      >
        <Avatar email={user.email} id={user.id} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 w-56 rounded-xl border border-border bg-card py-1 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          <div className="border-b border-border px-3 pb-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-9 w-full items-center px-3 text-left text-[13px] hover:bg-white/5"
            onClick={() => {
              setOpen(false);
              void logout().then(() => router.replace("/login"));
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
