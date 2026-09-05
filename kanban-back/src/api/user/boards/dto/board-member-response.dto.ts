import type { Role } from '@prisma/client';

export type BoardMemberResponseDto = {
  id: string;
  boardId: string;
  userId: string;
  email: string;
  role: Role;
};
