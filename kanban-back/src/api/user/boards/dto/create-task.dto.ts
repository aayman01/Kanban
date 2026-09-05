import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
