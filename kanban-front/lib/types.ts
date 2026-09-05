export type Role = "OWNER" | "EDITOR" | "VIEWER";

export type User = {
  id: string;
  email: string;
};

export type Board = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  taskCount?: number;
  role?: Role;
};

export type Member = {
  id: string;
  boardId: string;
  userId: string;
  email: string;
  role: Role;
};

export type Column = {
  id: string;
  boardId: string;
  title: string;
  position: number;
};

export type Task = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};
