"use client";

import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";
import type { CSSProperties, HTMLAttributes } from "react";

type CardProps = {
  task: Task;
  overlay?: boolean;
  canEdit?: boolean;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
  style?: CSSProperties;
  innerRef?: (node: HTMLElement | null) => void;
  dragging?: boolean;
};

export function TaskCard({
  task,
  overlay = false,
  canEdit = false,
  onOpen,
  onEdit,
  onDelete,
  style,
  innerRef,
  dragging = false,
}: CardProps) {
  return (
    <article
      ref={innerRef}
      style={style}
      className={cn(
        "group relative rounded-xl border border-transparent bg-card p-4",
        overlay && "bg-[#252525]",
        dragging && "opacity-40",
        !overlay &&
        !dragging &&
        "hover:border-foreground hover:bg-[#232323] focus-within:border-foreground",
      )}
    >
      {canEdit && !overlay ? (
        <div className="pointer-events-none absolute top-2 right-2 z-10 flex gap-0.5 rounded-lg bg-card/95 p-0.5 opacity-0 shadow-sm group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <button
            type="button"
            aria-label="Edit"
            onClick={onEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil strokeWidth={1.5} className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Delete"
            onClick={onDelete}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-[#E07A5F]"
          >
            <Trash2 strokeWidth={1.5} className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <button type="button" onClick={onOpen} className="w-full text-left">
        {/* <p className="text-xs text-muted-foreground">{formatAdded(task.createdAt)}</p> */}
        <h3 className="mt-2 text-[15px] leading-snug font-semibold">{task.title}</h3>
        {task.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {task.description}
          </p>
        ) : null}
      </button>
    </article>
  );
}

type SortableProps = {
  task: Task;
  canEdit: boolean;
  disabled?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SortableTaskCard({
  task,
  canEdit,
  disabled,
  onOpen,
  onEdit,
  onDelete,
}: SortableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled,
    attributes: { role: "group" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        canEdit={canEdit}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        dragging={isDragging}
      />
    </div>
  );
}
