import { z } from 'zod';

export const moveTaskSchema = z
  .object({
    columnId: z.string().uuid(),
    prevTaskId: z.string().uuid().nullable().optional(),
    nextTaskId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (value) =>
      !value.prevTaskId ||
      !value.nextTaskId ||
      value.prevTaskId !== value.nextTaskId,
    { message: 'prevTaskId and nextTaskId must differ' },
  );

export type MoveTaskDto = z.infer<typeof moveTaskSchema>;
