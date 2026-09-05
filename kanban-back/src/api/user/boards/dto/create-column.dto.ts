import { z } from 'zod';

export const createColumnSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

export type CreateColumnDto = z.infer<typeof createColumnSchema>;
