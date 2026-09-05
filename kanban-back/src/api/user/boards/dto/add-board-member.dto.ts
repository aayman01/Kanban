import { z } from 'zod';

export const shareableRoleSchema = z.enum(['EDITOR', 'VIEWER']);

export const addBoardMemberSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  role: shareableRoleSchema,
});

export type AddBoardMemberDto = z.infer<typeof addBoardMemberSchema>;
