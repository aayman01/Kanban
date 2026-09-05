import { http } from "@/lib/api/http";
import type { Board, Column, Member, Role } from "@/lib/types";

export type ShareableRole = Extract<Role, "EDITOR" | "VIEWER">;

export type CreatedBoard = Board & { role: "OWNER" };

export type BoardListItem = Board & {
  role: Role;
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

export type BoardColumnDto = Column & {
  tasks: BoardTaskDto[];
};

export type BoardDetail = Board & {
  role: Role;
  members: Member[];
  columns: BoardColumnDto[];
};

export async function createBoard(name: string) {
  const { data } = await http.post<CreatedBoard>("/user/boards", { name });
  return data;
}

export async function listBoards() {
  const { data } = await http.get<BoardListItem[]>("/user/boards");
  return data;
}

export async function getBoard(boardId: string) {
  const { data } = await http.get<BoardDetail>(`/user/boards/${boardId}`);
  return data;
}

export async function listBoardMembers(boardId: string) {
  const { data } = await http.get<Member[]>(`/user/boards/${boardId}/members`);
  return data;
}

export async function addBoardMember(
  boardId: string,
  body: { email: string; role: ShareableRole },
) {
  const { data } = await http.post<Member>(
    `/user/boards/${boardId}/members`,
    body,
  );
  return data;
}

export async function updateBoardMemberRole(
  boardId: string,
  memberId: string,
  role: ShareableRole,
) {
  const { data } = await http.patch<Member>(
    `/user/boards/${boardId}/members/${memberId}`,
    { role },
  );
  return data;
}

export async function removeBoardMember(boardId: string, memberId: string) {
  await http.delete(`/user/boards/${boardId}/members/${memberId}`);
}

export async function createTask(
  boardId: string,
  columnId: string,
  body: { title: string; description?: string | null },
) {
  const { data } = await http.post<BoardTaskDto>(
    `/user/boards/${boardId}/columns/${columnId}/tasks`,
    body,
  );
  return data;
}

export async function updateTask(
  boardId: string,
  taskId: string,
  patch: {
    title?: string;
    description?: string | null;
    columnId?: string;
  },
) {
  const { data } = await http.patch<BoardTaskDto>(
    `/user/boards/${boardId}/tasks/${taskId}`,
    patch,
  );
  return data;
}

export type ColumnResponse = {
  id: string;
  boardId: string;
  title: string;
  position: number;
};

export async function createColumn(boardId: string, title: string) {
  const { data } = await http.post<ColumnResponse>(
    `/user/boards/${boardId}/columns`,
    { title },
  );
  return data;
}

export async function updateColumn(
  boardId: string,
  columnId: string,
  title: string,
) {
  const { data } = await http.patch<ColumnResponse>(
    `/user/boards/${boardId}/columns/${columnId}`,
    { title },
  );
  return data;
}

export async function moveTask(
  boardId: string,
  taskId: string,
  body: {
    columnId: string;
    prevTaskId: string | null;
    nextTaskId: string | null;
  },
) {
  const { data } = await http.post<BoardTaskDto>(
    `/user/boards/${boardId}/tasks/${taskId}/move`,
    body,
  );
  return data;
}
