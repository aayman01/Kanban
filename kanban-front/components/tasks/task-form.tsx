"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  createTask as createTaskRequest,
  updateTask as updateTaskRequest,
} from "@/features/boards/api";
import { ApiError } from "@/lib/api/http";
import { useStore } from "@/lib/store";
import { useState, type FormEvent } from "react";

type Props = {
  boardId: string;
  columnId?: string;
  taskId?: string;
  onDone: () => void;
  onCancel: () => void;
};

export function TaskForm({
  boardId,
  columnId,
  taskId,
  onDone,
  onCancel,
}: Props) {
  const { columns, tasks, upsertTask } = useStore();
  const boardColumns = columns
    .filter((column) => column.boardId === boardId)
    .sort((a, b) => a.position - b.position);
  const existing = tasks.find((task) => task.id === taskId);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [selectedColumn, setSelectedColumn] = useState(
    existing?.columnId ?? columnId ?? boardColumns[0]?.id ?? "",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!selectedColumn) {
      setError("Select a column.");
      return;
    }
    setError("");
    setPending(true);
    const stamp = new Date().toISOString();
    try {
      const saved = taskId
        ? await updateTaskRequest(boardId, taskId, {
            title: title.trim(),
            description: description.trim() || null,
            columnId: selectedColumn,
          })
        : await createTaskRequest(boardId, selectedColumn, {
            title: title.trim(),
            description: description.trim() || null,
          });
      upsertTask({
        id: saved.id,
        columnId: saved.columnId,
        title: saved.title,
        description: saved.description,
        position: saved.position,
        createdAt: existing?.createdAt ?? stamp,
        updatedAt: stamp,
      });
      onDone();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Card title"
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Add a more detailed description…"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">List</span>
        <select
          value={selectedColumn}
          onChange={(event) => setSelectedColumn(event.target.value)}
          className="h-10 rounded-lg border border-border bg-input px-3 text-sm outline-none focus:border-foreground/40"
        >
          {boardColumns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-[#E07A5F]">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : taskId ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}
