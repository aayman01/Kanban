"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import { useState, type FormEvent } from "react";

type Props = {
  onAdd: (title: string) => Promise<void> | void;
};

export function AddColumn({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setError("");
    setPending(true);
    try {
      await onAdd(title.trim());
      setTitle("");
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="w-[280px] shrink-0">
      {open ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <Input
            label="List title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Review"
            autoFocus
          />
          {error ? <p className="text-sm text-[#E07A5F]">{error}</p> : null}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add list"}
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setTitle("");
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          + Add list
        </button>
      )}
    </section>
  );
}
