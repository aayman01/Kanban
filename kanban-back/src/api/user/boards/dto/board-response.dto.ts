import type { Role } from '@prisma/client';

export type BoardResponseDto = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
};

export type BoardListItemDto = BoardResponseDto & {
  memberCount: number;
  taskCount: number;
};

export type BoardTaskDto = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
};

export type BoardColumnDto = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  tasks: BoardTaskDto[];
};

export type ColumnResponseDto = {
  id: string;
  boardId: string;
  title: string;
  position: number;
};

export type BoardDetailDto = BoardResponseDto & {
  members: Array<{
    id: string;
    boardId: string;
    userId: string;
    email: string;
    role: Role;
  }>;
  columns: BoardColumnDto[];
};
