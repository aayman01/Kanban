import { z } from 'zod';

const durationSchema = z
  .string()
  .regex(/^\d+[smhd]$/, 'Must be a duration like 15m or 7d');

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: durationSchema.default('15m'),
  JWT_REFRESH_EXPIRES_IN: durationSchema.default('7d'),
});

export type AppEnv = z.infer<typeof envSchema>;
