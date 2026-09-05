---
name: api-organization
description: >-
  Organize Kanban Board API code: Controller → Service → Repository → Prisma
  table. Routes under src/api/{public,user}, repositories under
  src/repositories/<entity>-repository/, dto/ folders, @BoardAuth.
  Use when creating or modifying API routes, controllers, services, modules,
  DTOs, guards, repositories, or related endpoint files in kanban-back.
---

# API organization (Kanban Board API)

See [.cursor/rules/api-organization.mdc](../../rules/api-organization.mdc) for the full rule.

## Request flow (strict — no skipping layers)

```
Controller (src/api/…)  →  Service  →  Repository  →  Prisma table
```

| Layer | Location | Calls | Never calls |
|-------|----------|-------|-------------|
| Controller | `src/api/<area>/<feature>/` | Feature service | Repository, Prisma |
| Service | `src/api/<area>/<feature>/` | Repository service(s) | `PrismaService` for entity CRUD |
| Repository | `src/repositories/<entity>-repository/` | `PrismaService` → model delegate | Controllers, feature services |
| Prisma table | PostgreSQL | — | — |

Do not put business logic in controllers. Do not put HTTP concerns in repositories. Do not query Prisma tables from feature services.

## Route layout

| Folder | Route prefix | What belongs here |
|--------|--------------|-------------------|
| `src/api/public/` | `/public/...` | Register, login, refresh, health (no auth) |
| `src/api/user/` | `/user/...` | Boards, columns, tasks, board-member invites |

Global Nest prefix is `api/v1` → full paths `/api/v1/public/...`, `/api/v1/user/...`.

Auth helpers live under `src/api/public/auth/` (`POST /public/auth/register`, `login`, `refresh`). Keep them public — do not gate behind `@BoardAuth()`.

## Access control

- `@BoardAuth()` — guard checks `BoardMember` for `:boardId` in route params. Use on `board/`, `column/`, `task/` controllers.
- Guard: `src/api/user/auth/guards/board-auth.guard.ts`
- Import `BoardAuthModule` in any feature module using `@BoardAuth()`
- Role checks (`OWNER` / `EDITOR` / `VIEWER`) in guard or `@Roles(...)` — never inline in controller/service

## Repository pattern (all DB access)

All reads/writes go through `src/repositories/`. Never call `PrismaService` or `prisma.*` from controllers or feature services for entity CRUD.

### Folder layout

One folder per Prisma model, kebab-case with `-repository` suffix:

```
src/repositories/
  user-repository/
    user-repository.module.ts
    user-repository.service.ts
  board-repository/
  board-member-repository/
  column-repository/
  task-repository/
```

Each folder: exactly one module + one service. No controllers, DTOs, or guards in `repositories/`.

### Naming

| Item | Pattern | Example |
|------|---------|---------|
| Folder | `<entity>-repository/` | `board-member-repository/` |
| Module | `<Entity>RepositoryModule` | `BoardRepositoryModule` |
| Service | `<Entity>RepositoryService` | `BoardRepositoryService` |

### Repository service rules

- Inject `PrismaService` (not `PrismaClient` directly).
- One repository owns all Prisma access for that entity.
- Return Prisma model types or `null`; no HTTP exceptions in repositories.
- Accept optional `tx?: Prisma.TransactionClient` for transaction flows:

```typescript
@Injectable()
export class UserRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.create({ data });
  }
}
```

### Module wiring

```typescript
@Module({
  imports: [PrismaModule],
  providers: [BoardRepositoryService],
  exports: [BoardRepositoryService],
})
export class BoardRepositoryModule {}
```

- Feature modules import repository module(s) they need.
- Import `PrismaModule` in feature modules only when the **service** orchestrates `$transaction` via `PrismaService.transaction()`.

## Feature layout (API)

```
src/api/user/board/
  board.controller.ts
  board.service.ts
  board.module.ts
  dto/
    create-board.dto.ts
    update-board.dto.ts
    board-response.dto.ts
```

- Zod schemas in `dto/` — no loose `*.schemas.ts` beside controllers.
- Wire via `PublicApiModule`, `UserApiModule` into `AppModule`.

## Example flow

```typescript
// Controller — HTTP only
@Post()
create(@Body({ schema: createBoardSchema }) body: CreateBoardDto) {
  return this.boardService.create(body);
}

// Service — business logic; calls repository
async create(dto: CreateBoardDto) {
  return this.boardRepository.create({ name: dto.name });
}

// Repository — Prisma only
create(data: Prisma.BoardCreateInput, tx?: Prisma.TransactionClient) {
  const client = tx ?? this.prisma;
  return client.board.create({ data });
}
```

## Rules

1. Controllers and feature services never import `@prisma/client` or call `PrismaService` for entity CRUD.
2. One repository folder per entity.
3. Controller prefixes match folder (`public`, `user`).
4. Board routes use `@BoardAuth()`; modules import `BoardAuthModule`.
5. Race-safe writes: `$transaction` + locks — see [database-locking](../database-locking/SKILL.md).

## Checklist for new endpoints

- [ ] Chose `public` or `user` correctly
- [ ] Files under `src/api/<area>/...` with `dto/`
- [ ] DB access in `src/repositories/<entity>-repository/`, not in feature service
- [ ] Repository module imported in feature module
- [ ] Auth: public vs `@BoardAuth()` as appropriate
- [ ] `@Controller('<area>/...')` matches folder
- [ ] Module wired into area module / `AppModule`
- [ ] Contested writes use tx + correct lock (advisory vs row lock)
