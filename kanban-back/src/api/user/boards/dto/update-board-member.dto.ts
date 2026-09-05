import { z } from 'zod';
import { shareableRoleSchema } from './add-board-member.dto';

export const updateBoardMemberSchema = z.object({
  role: shareableRoleSchema,
});

export type UpdateBoardMemberDto = z.infer<typeof updateBoardMemberSchema>;
