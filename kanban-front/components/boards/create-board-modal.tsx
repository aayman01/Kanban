"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createBoard } from "@/features/boards/api";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/http";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateBoardModal({ open, onClose }: Props) {
  const { addBoard, addMember } = useStore();
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function reset() {
    setName("");
    setError("");
    setPending(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Board name is required.");
      return;
    }
    if (!user) {
      setError("You need to be signed in.");
      return;
    }
    setError("");
    setPending(true);
    try {
      const created = await createBoard(name.trim());
      addBoard({
        id: created.id,
        name: created.name,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      addMember({
        id: `${created.id}-owner`,
        boardId: created.id,
        userId: user.id,
        email: user.email,
        role: "OWNER",
      });
      handleClose();
      router.push(`/boards/${created.id}`);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
      setPending(false);
    }
  }

  return (
    <Modal open={open} title="New board" onClose={handleClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Board name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project Alpha"
          autoComplete="off"
        />
        {error ? <p className="text-sm text-[#E07A5F]">{error}</p> : null}
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}