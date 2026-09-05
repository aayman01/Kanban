# Mini Kanban

Full-stack Kanban board: Next.js (`kanban-front`) and NestJS (`kanban-back`) with PostgreSQL.

- UI: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3010/api/v1](http://localhost:3010/api/v1)

## Prerequisites

- Node.js 22
- [pnpm](https://pnpm.io)
- PostgreSQL 16, **or** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose starts Postgres, API, and UI)

## Sample environment variables

**`kanban-back/.env`**

```env
NODE_ENV=development
PORT=3010
DATABASE_URL=postgresql://kanban:kanban@localhost:5432/kanban
ALLOWED_ORIGINS=http://localhost:3000
JWT_ACCESS_SECRET=replace-with-at-least-32-character-access-secret
JWT_REFRESH_SECRET=replace-with-at-least-32-character-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**`kanban-front/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:3010/api/v1
```

Copy from `.env.example` in each app. JWT secrets must be at least 32 characters.

## Local setup

1. Create a Postgres database (or run only the `db` service from Compose: `docker compose up db -d`).
2. Backend:

```bash
cd kanban-back
cp .env.example .env
# set DATABASE_URL and JWT secrets in .env
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm start:dev
```

3. Frontend (another terminal):

```bash
cd kanban-front
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Register a user, create a board, then share it and drag tasks.

## Docker

JWT values in `docker-compose.yml` are for **local demo only**, not production.

```bash
docker compose up --build
```

- App: [http://localhost:3000](http://localhost:3000)
- API health: [http://localhost:3010/api/v1/health](http://localhost:3010/api/v1/health)

Stop with `Ctrl+C`, or `docker compose down` (add `-v` to drop the database volume).

## Task ordering

Drag-and-drop calls `POST /api/v1/user/boards/:boardId/tasks/:taskId/move` with `prevTaskId` / `nextTaskId`. The server writes a fractional midpoint between those neighbors (one row on the common path). Concurrent drops into the same gap are serialized with a column `FOR UPDATE` lock, unique `(columnId, position)`, and `409` when neighbors are no longer adjacent. If the gap is smaller than `1e-4`, the destination column is re-spaced to `1, 2, 3, …` and the move is retried in a new transaction.
