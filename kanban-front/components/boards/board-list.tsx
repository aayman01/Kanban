"use client";

import { CreateBoardModal } from "@/components/boards/create-board-modal";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { listBoards } from "@/features/boards/api";
import { ApiError } from "@/lib/api/http";
import { formatRole } from "@/lib/format";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useEffect, useState } from "react";

export function BoardList() {
  const { boards, members, columns, tasks, setBoards } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listBoards()
      .then((next) => {
        if (!cancelled) setBoards(next);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setBoards]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold md:text-3xl">Boards</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-white px-4 text-black hover:bg-white/90"
            >
              Add board
            </Button>
            <UserMenu />
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading boards…" />
        ) : error ? (
          <div className="mt-10">
            <EmptyState title="Could not load boards" body={error} />
          </div>
        ) : boards.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No boards yet"
              body="Create your first board to start organizing work."
              actionLabel="Add board"
              onAction={() => setCreateOpen(true)}
            />
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => {
              const boardMembers = members.filter(
                (member) => member.boardId === board.id,
              );
              const boardColumns = columns.filter(
                (column) => column.boardId === board.id,
              );
              const columnIds = new Set(boardColumns.map((column) => column.id));
              const taskCount =
                board.taskCount ??
                tasks.filter((task) => columnIds.has(task.columnId)).length;
              const memberCount = board.memberCount ?? boardMembers.length;
              return (
                <li key={board.id}>
                  <Link
                    href={`/boards/${board.id}`}
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-4 hover:bg-muted"
                  >
                    <span className="truncate font-medium">{board.name}</span>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {memberCount} members · {taskCount} tasks
                      {board.role ? ` · ${formatRole(board.role)}` : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
