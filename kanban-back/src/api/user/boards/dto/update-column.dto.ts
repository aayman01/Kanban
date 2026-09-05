import { z } from 'zod';

export const updateColumnSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

export type UpdateColumnDto = z.infer<typeof updateColumnSchema>;
