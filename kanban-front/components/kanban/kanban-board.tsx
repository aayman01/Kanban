"use client";

import { AddColumn } from "@/components/kanban/add-column";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TaskCard } from "@/components/kanban/task-card";
import {
  createColumn as createColumnRequest,
  createTask as createTaskRequest,
  getBoard,
  moveTask as moveTaskRequest,
  updateColumn as updateColumnRequest,
} from "@/features/boards/api";
import { ApiError } from "@/lib/api/http";
import { useStore } from "@/lib/store";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useRef, useState } from "react";

type Props = {
  boardId: string;
  canEdit: boolean;
  onOpenTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
};

type DropIntent = {
  taskId: string;
  columnId: string;
  index: number;
};

export function KanbanBoard({
  boardId,
  canEdit,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onDeleteColumn,
}: Props) {
  const { columns, tasks, upsertColumn, upsertTask, moveTask, hydrateBoard } =
    useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDropRef = useRef<string>("");
  const intentRef = useRef<DropIntent | null>(null);
  const dirtyMoveRef = useRef(false);

  const boardColumns = useMemo(
    () =>
      columns
        .filter((column) => column.boardId === boardId)
        .sort((a, b) => a.position - b.position),
    [columns, boardId],
  );

  const columnIds = useMemo(
    () => new Set(boardColumns.map((column) => column.id)),
    [boardColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = tasks.find((task) => task.id === activeId);

  const tasksInColumn = useCallback(
    (columnId: string, excludeId?: string) =>
      tasks
        .filter((task) => task.columnId === columnId && task.id !== excludeId)
        .sort((a, b) => a.position - b.position),
    [tasks],
  );

  const indexFromY = useCallback(
    (
      columnId: string,
      activeTaskId: string,
      y: number,
      droppableRects: {
        get: (id: UniqueIdentifier) => { top: number; height: number } | undefined;
      },
    ) => {
      const siblings = tasksInColumn(columnId, activeTaskId);
      for (let index = 0; index < siblings.length; index += 1) {
        const rect = droppableRects.get(siblings[index].id);
        if (!rect) continue;
        if (y < rect.top + rect.height / 2) return index;
      }
      return siblings.length;
    },
    [tasksInColumn],
  );

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerHits = pointerWithin(args);
      const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);

      const taskHit = hits.find((collision) =>
        tasks.some((task) => task.id === String(collision.id)),
      );
      const columnHit = hits.find((collision) => columnIds.has(String(collision.id)));
      const chosen = taskHit ?? columnHit;
      const collisions = chosen ? [chosen] : closestCorners(args);

      const overId = collisions[0]?.id;
      const activeTaskId = String(args.active.id);
      if (overId == null) {
        intentRef.current = null;
        return collisions;
      }

      const columnId = columnIds.has(String(overId))
        ? String(overId)
        : (tasks.find((task) => task.id === String(overId))?.columnId ?? null);

      if (!columnId) {
        intentRef.current = null;
        return collisions;
      }

      const y = args.collisionRect.top + args.collisionRect.height / 2;
      intentRef.current = {
        taskId: activeTaskId,
        columnId,
        index: indexFromY(columnId, activeTaskId, y, args.droppableRects),
      };
      return collisions;
    },
    [columnIds, indexFromY, tasks],
  );

  const applyIntent = useCallback(() => {
    const intent = intentRef.current;
    if (!intent || !canEdit) return false;
    const key = `${intent.taskId}:${intent.columnId}:${intent.index}`;
    if (lastDropRef.current === key) return false;

    const current = tasks.find((task) => task.id === intent.taskId);
    if (!current) return false;
    if (current.columnId === intent.columnId) {
      const index = tasksInColumn(intent.columnId).findIndex(
        (task) => task.id === intent.taskId,
      );
      if (index === intent.index) {
        lastDropRef.current = key;
        return false;
      }
    }

    lastDropRef.current = key;
    moveTask(intent.taskId, intent.columnId, intent.index);
    dirtyMoveRef.current = true;
    return true;
  }, [canEdit, moveTask, tasks, tasksInColumn]);

  const persistMove = useCallback(
    async (intent: DropIntent) => {
      const siblings = tasksInColumn(intent.columnId, intent.taskId);
      const prev = siblings[intent.index - 1] ?? null;
      const next = siblings[intent.index] ?? null;
      const current = tasks.find((task) => task.id === intent.taskId);
      try {
        const saved = await moveTaskRequest(boardId, intent.taskId, {
          columnId: intent.columnId,
          prevTaskId: prev?.id ?? null,
          nextTaskId: next?.id ?? null,
        });
        const stamp = new Date().toISOString();
        upsertTask({
          id: saved.id,
          columnId: saved.columnId,
          title: saved.title,
          description: saved.description,
          position: saved.position,
          createdAt: current?.createdAt ?? stamp,
          updatedAt: stamp,
        });
      } catch (cause) {
        if (!(cause instanceof ApiError) && !(cause instanceof Error)) {
          return;
        }
        const detail = await getBoard(boardId);
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
      }
    },
    [boardId, hydrateBoard, tasks, tasksInColumn, upsertTask],
  );

  function scrollToColumn(index: number) {
    const column = scrollerRef.current?.querySelectorAll("[data-column]")[index];
    column?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={(event) => {
        lastDropRef.current = "";
        intentRef.current = null;
        dirtyMoveRef.current = false;
        setActiveId(String(event.active.id));
      }}
      onDragOver={applyIntent}
      onDragEnd={() => {
        applyIntent();
        const intent = intentRef.current;
        const shouldPersist = dirtyMoveRef.current;
        dirtyMoveRef.current = false;
        setActiveId(null);
        if (shouldPersist && intent) {
          void persistMove(intent);
        }
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full flex-col">
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          {boardColumns.map((column, index) => (
            <button
              key={column.id}
              type="button"
              onClick={() => scrollToColumn(index)}
              className="min-h-8 shrink-0 rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {column.title}
            </button>
          ))}
        </div>
        <div
          ref={scrollerRef}
          className="mb-6 flex min-h-0 flex-1 items-start gap-8 snap-x snap-mandatory overflow-x-auto overflow-y-hidden px-6 pt-6 pb-10 md:mb-10 md:px-10"
        >
          {boardColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks
                .filter((task) => task.columnId === column.id)
                .sort((a, b) => a.position - b.position)}
              canEdit={canEdit}
              onRename={async (title) => {
                const saved = await updateColumnRequest(
                  boardId,
                  column.id,
                  title,
                );
                upsertColumn(saved);
              }}
              onDelete={() => onDeleteColumn(column.id)}
              onAddTask={async (title, description) => {
                const saved = await createTaskRequest(boardId, column.id, {
                  title,
                  description: description || null,
                });
                const stamp = new Date().toISOString();
                upsertTask({
                  id: saved.id,
                  columnId: saved.columnId,
                  title: saved.title,
                  description: saved.description,
                  position: saved.position,
                  createdAt: stamp,
                  updatedAt: stamp,
                });
              }}
              onOpenTask={onOpenTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
          {canEdit ? (
            <AddColumn
              onAdd={async (title) => {
                const saved = await createColumnRequest(boardId, title);
                upsertColumn(saved);
              }}
            />
          ) : null}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
