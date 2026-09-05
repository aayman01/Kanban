"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { uid } from "./id";
import type { Board, Column, Member, Role, Task } from "./types";

type Store = {
  boards: Board[];
  members: Member[];
  columns: Column[];
  tasks: Task[];
  setBoards: (next: Board[]) => void;
  addBoard: (board: Board) => void;
  hydrateBoard: (input: {
    board: Board;
    members: Member[];
    columns: Column[];
    tasks: Task[];
  }) => void;
  renameBoard: (boardId: string, name: string) => void;
  deleteBoard: (boardId: string) => void;
  createColumn: (boardId: string, title: string) => Column;
  renameColumn: (columnId: string, title: string) => void;
  upsertColumn: (column: Column) => void;
  deleteColumn: (columnId: string) => void;
  createTask: (
    columnId: string,
    title: string,
    description: string | null,
  ) => Task;
  updateTask: (
    taskId: string,
    patch: { title?: string; description?: string | null; columnId?: string },
  ) => void;
  deleteTask: (taskId: string) => void;
  upsertTask: (task: Task) => void;
  moveTask: (taskId: string, targetColumnId: string, targetIndex: number) => void;
  addMember: (member: Member) => void;
  setMembersForBoard: (boardId: string, next: Member[]) => void;
  updateMemberRole: (memberId: string, role: Role) => void;
  removeMember: (memberId: string) => void;
  roleFor: (boardId: string, userId: string) => Role | null;
};

const StoreContext = createContext<Store | null>(null);

function reindex(tasks: Task[], columnId: string): Task[] {
  const ordered = tasks
    .filter((task) => task.columnId === columnId)
    .sort((a, b) => a.position - b.position);
  const positions = new Map(ordered.map((task, index) => [task.id, index]));
  return tasks.map((task) => {
    const next = positions.get(task.id);
    return next === undefined ? task : { ...task, position: next };
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boards, setBoardsState] = useState<Board[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const setBoards = useCallback((next: Board[]) => {
    setBoardsState(next);
  }, []);

  const addBoard = useCallback((board: Board) => {
    setBoardsState((prev) => [
      board,
      ...prev.filter((item) => item.id !== board.id),
    ]);
  }, []);

  const hydrateBoard = useCallback(
    (input: {
      board: Board;
      members: Member[];
      columns: Column[];
      tasks: Task[];
    }) => {
      setBoardsState((prev) => [
        input.board,
        ...prev.filter((item) => item.id !== input.board.id),
      ]);
      setMembers((prev) => [
        ...prev.filter((member) => member.boardId !== input.board.id),
        ...input.members,
      ]);
      setColumns((prev) => [
        ...prev.filter((column) => column.boardId !== input.board.id),
        ...input.columns,
      ]);
      const columnIds = new Set(input.columns.map((column) => column.id));
      setTasks((prev) => [
        ...prev.filter((task) => !columnIds.has(task.columnId)),
        ...input.tasks,
      ]);
    },
    [],
  );

  const renameBoard = useCallback((boardId: string, name: string) => {
    setBoardsState((prev) =>
      prev.map((board) =>
        board.id === boardId
          ? { ...board, name: name.trim(), updatedAt: new Date().toISOString() }
          : board,
      ),
    );
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setBoardsState((prev) => prev.filter((board) => board.id !== boardId));
    setMembers((prev) => prev.filter((member) => member.boardId !== boardId));
    setColumns((prev) => {
      const removed = new Set(
        prev.filter((column) => column.boardId === boardId).map((column) => column.id),
      );
      setTasks((tasksPrev) => tasksPrev.filter((task) => !removed.has(task.columnId)));
      return prev.filter((column) => column.boardId !== boardId);
    });
  }, []);

  const createColumn = useCallback((boardId: string, title: string) => {
    let created: Column = {
      id: uid("col"),
      boardId,
      title: title.trim(),
      position: 0,
    };
    setColumns((prev) => {
      const position = prev.filter((column) => column.boardId === boardId).length;
      created = { ...created, position };
      return [...prev, created];
    });
    return created;
  }, []);

  const renameColumn = useCallback((columnId: string, title: string) => {
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId ? { ...column, title: title.trim() } : column,
      ),
    );
  }, []);

  const upsertColumn = useCallback((column: Column) => {
    setColumns((prev) => {
      const existing = prev.find((item) => item.id === column.id);
      if (!existing) {
        return [...prev, column];
      }
      return prev.map((item) =>
        item.id === column.id ? { ...item, ...column } : item,
      );
    });
  }, []);

  const deleteColumn = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((column) => column.id !== columnId));
    setTasks((prev) => prev.filter((task) => task.columnId !== columnId));
  }, []);

  const createTask = useCallback(
    (columnId: string, title: string, description: string | null) => {
      const stamp = new Date().toISOString();
      let created: Task = {
        id: uid("task"),
        columnId,
        title: title.trim(),
        description: description?.trim() || null,
        position: 0,
        createdAt: stamp,
        updatedAt: stamp,
      };
      setTasks((prev) => {
        const position = prev.filter((task) => task.columnId === columnId).length;
        created = { ...created, position };
        return [...prev, created];
      });
      return created;
    },
    [],
  );

  const updateTask = useCallback(
    (
      taskId: string,
      patch: { title?: string; description?: string | null; columnId?: string },
    ) => {
      setTasks((prev) => {
        const current = prev.find((task) => task.id === taskId);
        if (!current) return prev;
        const nextColumnId = patch.columnId ?? current.columnId;
        let next = prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                title: patch.title?.trim() ?? task.title,
                description:
                  patch.description === undefined
                    ? task.description
                    : patch.description?.trim() || null,
                columnId: nextColumnId,
                updatedAt: new Date().toISOString(),
              }
            : task,
        );
        if (nextColumnId !== current.columnId) {
          next = reindex(next, current.columnId);
          next = reindex(next, nextColumnId);
        }
        return next;
      });
    },
    [],
  );

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const current = prev.find((task) => task.id === taskId);
      if (!current) return prev;
      return reindex(
        prev.filter((task) => task.id !== taskId),
        current.columnId,
      );
    });
  }, []);

  const upsertTask = useCallback((task: Task) => {
    setTasks((prev) => {
      const existing = prev.find((item) => item.id === task.id);
      if (!existing) {
        return [...prev, task];
      }
      return prev.map((item) => (item.id === task.id ? { ...item, ...task } : item));
    });
  }, []);

  const moveTask = useCallback(
    (taskId: string, targetColumnId: string, targetIndex: number) => {
      setTasks((prev) => {
        const current = prev.find((task) => task.id === taskId);
        if (!current) return prev;

        const without = prev.filter((task) => task.id !== taskId);
        const target = without
          .filter((task) => task.columnId === targetColumnId)
          .sort((a, b) => a.position - b.position);
        const index = Math.max(0, Math.min(targetIndex, target.length));
        const moved: Task = {
          ...current,
          columnId: targetColumnId,
          updatedAt: new Date().toISOString(),
        };
        target.splice(index, 0, moved);

        const positions = new Map<string, { columnId: string; position: number }>();
        target.forEach((task, position) => {
          positions.set(task.id, { columnId: targetColumnId, position });
        });

        if (current.columnId !== targetColumnId) {
          without
            .filter((task) => task.columnId === current.columnId)
            .sort((a, b) => a.position - b.position)
            .forEach((task, position) => {
              positions.set(task.id, { columnId: current.columnId, position });
            });
        }

        return without
          .map((task) => {
            const next = positions.get(task.id);
            return next ? { ...task, ...next } : task;
          })
          .concat(
            positions.has(moved.id)
              ? [{ ...moved, ...positions.get(moved.id)! }]
              : [moved],
          );
      });
    },
    [],
  );

  const addMember = useCallback((member: Member) => {
    setMembers((prev) => {
      if (prev.some((item) => item.id === member.id)) {
        return prev.map((item) => (item.id === member.id ? member : item));
      }
      return [...prev, member];
    });
  }, []);

  const setMembersForBoard = useCallback((boardId: string, next: Member[]) => {
    setMembers((prev) => [
      ...prev.filter((member) => member.boardId !== boardId),
      ...next,
    ]);
  }, []);

  const updateMemberRole = useCallback((memberId: string, role: Role) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    );
  }, []);

  const removeMember = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
  }, []);

  const roleFor = useCallback((boardId: string, userId: string) => {
    return (
      members.find(
        (member) => member.boardId === boardId && member.userId === userId,
      )?.role ?? null
    );
  }, [members]);

  const value = useMemo<Store>(
    () => ({
      boards,
      members,
      columns,
      tasks,
      setBoards,
      addBoard,
      hydrateBoard,
      renameBoard,
      deleteBoard,
      createColumn,
      renameColumn,
      upsertColumn,
      deleteColumn,
      createTask,
      updateTask,
      deleteTask,
      upsertTask,
      moveTask,
      addMember,
      setMembersForBoard,
      updateMemberRole,
      removeMember,
      roleFor,
    }),
    [
      boards,
      members,
      columns,
      tasks,
      setBoards,
      addBoard,
      hydrateBoard,
      renameBoard,
      deleteBoard,
      createColumn,
      renameColumn,
      upsertColumn,
      deleteColumn,
      createTask,
      updateTask,
      deleteTask,
      upsertTask,
      moveTask,
      addMember,
      setMembersForBoard,
      updateMemberRole,
      removeMember,
      roleFor,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return store;
}
