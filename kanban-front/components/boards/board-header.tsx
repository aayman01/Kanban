"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { UserMenu } from "@/components/layout/user-menu";
import { useAuth } from "@/features/auth/use-auth";
import { useStore } from "@/lib/store";
import { formatRole } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = {
  boardId: string;
  onShare: () => void;
};

export function BoardHeader({ boardId, onShare }: Props) {
  const { boards, members, renameBoard, deleteBoard, roleFor } = useStore();
  const { user } = useAuth();
  const router = useRouter();
  const board = boards.find((item) => item.id === boardId);
  const role = user ? roleFor(boardId, user.id) : null;
  const canManage = role === "OWNER";
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(board?.name ?? "");

  if (!board) return null;

  const boardMembers = members.filter((member) => member.boardId === boardId);

  function onRename(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    renameBoard(boardId, name);
    setRenameOpen(false);
  }

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-6 md:px-10">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Boards
          </Link>
          <span className="text-muted-foreground" aria-hidden="true">
            /
          </span>
          <h1 className="truncate text-xl font-semibold md:text-2xl">
            {board.name}
          </h1>
          {role ? (
            <span
              className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
              aria-label={`Your access: ${formatRole(role)}`}
            >
              {formatRole(role)}
            </span>
          ) : null}
        </div>
        {role === "VIEWER" ? (
          <p className="text-xs text-muted-foreground">
            You can view this board. Editing is disabled.
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center sm:flex">
          {boardMembers.slice(0, 5).map((member, index) => (
            <Avatar
              key={member.id}
              email={member.email}
              id={member.userId}
              size="sm"
              className={index === 0 ? "ring-2 ring-background" : "-ml-1.5 ring-2 ring-background"}
            />
          ))}
        </div>
        <Button variant="secondary" onClick={onShare} className="h-8 min-h-8 px-3">
          Share
        </Button>
        {canManage ? (
          <Dropdown
            label="Board settings"
            trigger={<span className="text-sm">Settings</span>}
            items={[
              {
                label: "Rename",
                onSelect: () => {
                  setName(board.name);
                  setRenameOpen(true);
                },
              },
              {
                label: "Delete board",
                onSelect: () => setDeleteOpen(true),
                destructive: true,
              },
            ]}
          />
        ) : null}
        <UserMenu />
      </div>

      <Modal
        open={renameOpen}
        title="Rename board"
        onClose={() => setRenameOpen(false)}
      >
        <form onSubmit={onRename} className="flex flex-col gap-4">
          <Input
            label="Board name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete board"
        body="This will remove the board, its columns, and all tasks. This cannot be undone."
        confirmLabel="Delete board"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteBoard(boardId);
          setDeleteOpen(false);
          router.push("/");
        }}
      />
    </header>
  );
}
