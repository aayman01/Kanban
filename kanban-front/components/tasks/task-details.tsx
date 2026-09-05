"use client";

import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/tasks/task-form";
import { formatDate, pad2 } from "@/lib/format";
import { useAuth } from "@/features/auth/use-auth";
import { useStore } from "@/lib/store";
import { useState } from "react";

type Props = {
  taskId: string;
  boardId: string;
  onClose: () => void;
  onDelete: () => void;
};

const selectClass =
  "h-10 rounded-lg border border-border bg-input px-3 text-sm outline-none focus:border-foreground/40";

export function TaskDetails({ taskId, boardId, onClose, onDelete }: Props) {
  const { tasks, columns, moveTask, roleFor } = useStore();
  const { user } = useAuth();
  const task = tasks.find((item) => item.id === taskId);
  const column = columns.find((item) => item.id === task?.columnId);
  const boardColumns = columns
    .filter((item) => item.boardId === boardId)
    .sort((a, b) => a.position - b.position);
  const role = user ? roleFor(boardId, user.id) : null;
  const canEdit = role === "OWNER" || role === "EDITOR";
  const [editing, setEditing] = useState(false);
  const [targetColumn, setTargetColumn] = useState(task?.columnId ?? "");
  const [targetIndex, setTargetIndex] = useState(
    task ? pad2(task.position + 1) : "01",
  );

  if (!task) {
    return (
      <p className="text-sm text-muted-foreground">
        This task is no longer available.
      </p>
    );
  }

  const current = task;
  const targetTasks = tasks
    .filter((item) => item.columnId === targetColumn)
    .sort((a, b) => a.position - b.position);
  const maxIndex =
    targetColumn === current.columnId
      ? targetTasks.length
      : targetTasks.length + 1;

  function handleMove() {
    const index = Math.max(0, Number.parseInt(targetIndex, 10) - 1);
    moveTask(current.id, targetColumn, index);
  }

  if (editing) {
    return (
      <TaskForm
        boardId={boardId}
        taskId={task.id}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-semibold">{task.title}</h3>

      <section>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Description
        </p>
        <p className="text-sm leading-6">
          {task.description || "No description."}
        </p>
      </section>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">List</dt>
          <dd className="mt-1">{column?.title ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Position</dt>
          <dd className="mt-1">{task.position + 1}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Created</dt>
          <dd className="mt-1">{formatDate(task.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Updated</dt>
          <dd className="mt-1">{formatDate(task.updatedAt)}</dd>
        </div>
      </dl>

      {canEdit ? (
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Move card
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">List</span>
              <select
                value={targetColumn}
                onChange={(event) => {
                  setTargetColumn(event.target.value);
                  setTargetIndex("01");
                }}
                className={selectClass}
              >
                {boardColumns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Position</span>
              <select
                value={targetIndex}
                onChange={(event) => setTargetIndex(event.target.value)}
                className={selectClass}
              >
                {Array.from({ length: maxIndex }, (_, index) => (
                  <option key={index} value={pad2(index + 1)}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="secondary" onClick={handleMove}>
              Move
            </Button>
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {canEdit ? (
          <>
            <Button variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
