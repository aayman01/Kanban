import { z } from 'zod';

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    columnId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.columnId !== undefined,
    { message: 'Provide title, description, or columnId' },
  );

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
