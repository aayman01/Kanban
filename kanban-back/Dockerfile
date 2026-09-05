FROM node:22-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

COPY . .
ENV DATABASE_URL=postgresql://kanban:kanban@db:5432/kanban
RUN pnpm prisma generate && pnpm build

FROM node:22-bookworm-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3010

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json

EXPOSE 3010

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main"]
