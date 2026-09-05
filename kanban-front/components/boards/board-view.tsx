"use client";

import { BoardHeader } from "@/components/boards/board-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ShareBoard } from "@/components/members/share-board";
import { TaskDetails } from "@/components/tasks/task-details";
import { TaskForm } from "@/components/tasks/task-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/use-auth";
import { getBoard } from "@/features/boards/api";
import { ApiError } from "@/lib/api/http";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

type Props = {
  boardId: string;
};

export function BoardView({ boardId }: Props) {
  const { boards, tasks, columns, deleteTask, deleteColumn, roleFor, hydrateBoard } =
    useStore();
  const { user } = useAuth();
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const board = boards.find((item) => item.id === boardId);
  const role = user ? roleFor(boardId, user.id) : null;
  const canEdit = role === "OWNER" || role === "EDITOR";

  useEffect(() => {
    let cancelled = false;
    getBoard(boardId)
      .then((detail) => {
        if (cancelled) return;
        const stamp = new Date().toISOString();
        hydrateBoard({
          board: {
            id: detail.id,
            name: detail.name,
            createdAt: detail.createdAt,
            updatedAt: detail.updatedAt,
            role: detail.role,
          },
          members: detail.members,
          columns: detail.columns.map((column) => ({
            id: column.id,
            boardId: column.boardId,
            title: column.title,
            position: column.position,
          })),
          tasks: detail.columns.flatMap((column) =>
            column.tasks.map((task) => ({
              id: task.id,
              columnId: task.columnId,
              title: task.title,
              description: task.description,
              position: task.position,
              createdAt: stamp,
              updatedAt: stamp,
            })),
          ),
        });
        setLoadState("ready");
      })
      .catch((cause) => {
        if (cancelled) return;
        setLoadError(
          cause instanceof ApiError ? cause.message : "Something went wrong.",
        );
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, hydrateBoard]);

  const [shareOpen, setShareOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [pendingTaskDelete, setPendingTaskDelete] = useState<string | null>(null);
  const [pendingColumnDelete, setPendingColumnDelete] = useState<string | null>(
    null,
  );

  if (loadState === "loading") {
    return (
      <div className="flex h-full items-center">
        <LoadingState label="Loading board…" />
      </div>
    );
  }

  if (loadState === "error" || !board) {
    return (
      <div className="flex h-full items-center px-8">
        <EmptyState
          title="Board not found"
          body={
            loadError ||
            "This board is unavailable or you no longer have access."
          }
        />
      </div>
    );
  }

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const pendingColumn = columns.find((column) => column.id === pendingColumnDelete);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <BoardHeader boardId={boardId} onShare={() => setShareOpen(true)} />
      <div className="min-h-0 flex-1">
        <KanbanBoard
          boardId={boardId}
          canEdit={canEdit}
          onOpenTask={(taskId) => setSelectedTaskId(taskId)}
          onEditTask={(taskId) => setEditingTaskId(taskId)}
          onDeleteTask={(taskId) => setPendingTaskDelete(taskId)}
          onDeleteColumn={(columnId) => setPendingColumnDelete(columnId)}
        />
      </div>

      <Drawer
        open={Boolean(selectedTaskId)}
        title="Task"
        onClose={() => setSelectedTaskId(null)}
      >
        {selectedTaskId ? (
          <TaskDetails
            key={selectedTaskId}
            taskId={selectedTaskId}
            boardId={boardId}
            onClose={() => setSelectedTaskId(null)}
            onDelete={() => {
              setPendingTaskDelete(selectedTaskId);
            }}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={shareOpen}
        title={`Share ${board.name}`}
        onClose={() => setShareOpen(false)}
      >
        <ShareBoard boardId={boardId} />
      </Drawer>

      <Modal
        open={Boolean(editingTaskId)}
        title="Edit card"
        onClose={() => setEditingTaskId(null)}
      >
        {editingTaskId ? (
          <TaskForm
            boardId={boardId}
            taskId={editingTaskId}
            onDone={() => setEditingTaskId(null)}
            onCancel={() => setEditingTaskId(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingTaskDelete)}
        title="Delete Task"
        body={`Delete “${selectedTask?.title ?? tasks.find((task) => task.id === pendingTaskDelete)?.title ?? "this task"}”? This cannot be undone.`}
        confirmLabel="Delete Task"
        onClose={() => setPendingTaskDelete(null)}
        onConfirm={() => {
          if (pendingTaskDelete) {
            deleteTask(pendingTaskDelete);
            if (selectedTaskId === pendingTaskDelete) setSelectedTaskId(null);
          }
          setPendingTaskDelete(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingColumnDelete)}
        title="Delete Column"
        body={`Delete “${pendingColumn?.title ?? "this column"}” and all of its tasks? This cannot be undone.`}
        confirmLabel="Delete Column"
        onClose={() => setPendingColumnDelete(null)}
        onConfirm={() => {
          if (pendingColumnDelete) deleteColumn(pendingColumnDelete);
          setPendingColumnDelete(null);
        }}
      />
    </div>
  );
}
