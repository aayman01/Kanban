"use client";

import { ColumnHeader } from "@/components/kanban/column-header";
import { SortableTaskCard } from "@/components/kanban/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import type { Column, Task } from "@/lib/types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState, type FormEvent } from "react";

type Props = {
  column: Column;
  tasks: Task[];
  canEdit: boolean;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => void;
  onAddTask: (title: string, description: string) => Promise<void> | void;
  onOpenTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
};

export function KanbanColumn({
  column,
  tasks,
  canEdit,
  onRename,
  onDelete,
  onAddTask,
  onOpenTask,
  onEditTask,
  onDeleteTask,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setError("");
    setPending(true);
    try {
      await onAddTask(title.trim(), "");
      setTitle("");
      setAdding(false);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      data-column
      className={cn(
        "flex max-h-full w-[280px] shrink-0 snap-center flex-col gap-6",
        isOver && "opacity-90",
      )}
    >
      <ColumnHeader
        title={column.title}
        count={tasks.length}
        canEdit={canEdit}
        onRename={onRename}
        onDelete={onDelete}
      />
      <div
        ref={setNodeRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2"
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              disabled={!canEdit}
              onOpen={() => onOpenTask(task.id)}
              onEdit={() => onEditTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>
        {canEdit ? (
          adding ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <Input
                label="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Card title"
                autoFocus
              />
              {error ? <p className="text-sm text-[#E07A5F]">{error}</p> : null}
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Adding…" : "Add"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setAdding(false);
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
              onClick={() => setAdding(true)}
              className="w-full rounded-xl bg-card px-4 py-3 text-left text-sm text-muted-foreground hover:bg-[#232323] hover:text-foreground"
            >
              + Add a card
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}
