"use client";

import { Dropdown } from "@/components/ui/dropdown";
import { ApiError } from "@/lib/api/http";
import { useRef, useState } from "react";

type Props = {
  title: string;
  count: number;
  canEdit: boolean;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => void;
};

export function ColumnHeader({
  title,
  count,
  canEdit,
  onRename,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  const value = draft ?? title;
  const editing = draft !== null;

  async function commit() {
    if (pendingRef.current) return;
    const next = value.trim();
    if (!next || next === title) {
      setDraft(null);
      setError("");
      return;
    }
    setError("");
    pendingRef.current = true;
    setPending(true);
    try {
      await onRename(next);
      setDraft(null);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-1">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              value={value}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                void commit();
              }}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void commit();
                }
                if (event.key === "Escape") {
                  setDraft(null);
                  setError("");
                }
              }}
              disabled={pending}
              autoFocus
              className="h-8 w-full rounded-lg border border-border bg-input px-2 text-sm font-semibold outline-none disabled:opacity-70"
              aria-label="Column title"
            />
            {error ? <p className="text-xs text-[#E07A5F]">{error}</p> : null}
          </div>
        ) : (
          <h2 className="truncate text-sm font-medium text-muted-foreground">
            {title}{" "}
            <span className="text-muted-foreground/70">{count}</span>
          </h2>
        )}
      </div>
      {canEdit ? (
        <Dropdown
          label={`${title} column menu`}
          items={[
            { label: "Rename", onSelect: () => setDraft(title) },
            { label: "Delete", onSelect: onDelete, destructive: true },
          ]}
        />
      ) : null}
    </header>
  );
}
