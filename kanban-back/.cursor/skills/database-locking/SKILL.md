---
name: database-locking
description: >-
  Race-safe Prisma transactions for kanban-back: advisory locks, SELECT FOR
  UPDATE row locks, fractional task positioning, and column rebalancing. Use
  when implementing task moves, column reorder, board-member invites, deletes,
  or any multi-step read-modify-write in feature services.
---

# Database locking (Kanban Board API)

See [.cursor/rules/database-locking.mdc](../../rules/database-locking.mdc) for the full rule.

Apply locking in **feature services** (`src/api/...`). Repositories accept `tx` and perform Prisma calls only — do not acquire locks inside repositories.

## Stack

- **ORM:** Prisma (`$transaction`, default READ COMMITTED)
- **Helpers:** `src/common/db/` — `advisoryXactLock`, row-lock helpers, `rebalanceColumnInTx`
- **Transactions:** `PrismaService.transaction()` or `prisma.$transaction`; pass `tx` into repository methods

## Lock type decision

| Use case | Lock |
|----------|------|
| Read then update/delete specific rows in same tx | Row lock (`FOR UPDATE`) via `src/common/db/row-lock.ts` |
| Task move position calculation within a column | Advisory lock `column:${columnId}:position` |
| Column reorder within a board | Advisory lock `board:${boardId}:column-position` |
| Board member invite (one row per user/board) | Advisory lock `board:${boardId}:member-invite` + `@@unique([boardId, userId])` |
| Read-only | No lock |

## Advisory locks

Task moves are the main case. Two concurrent drags into the same column can read the same `prev`/`next` neighbors and compute the same midpoint → duplicate `position` values. Serialize **per column**, not per task.

```typescript
await advisoryXactLock(tx, `column:${columnId}:position`);
```

Stable keys: `column:${columnId}:position`, `board:${boardId}:column-position`, `board:${boardId}:member-invite`.

## Row locks

Use when updating/deleting a specific row in the same transaction:

- Task delete, column delete, board-member removal
- Single task position update after `prevTaskId`/`nextTaskId` are resolved

Call helpers in `src/common/db/row-lock.ts` at the start of the transaction, then read/write with the same `tx`.

## Task move pattern (fractional positioning)

Locking and position logic live in the **feature service**. Repositories load/update tasks via `tx`:

```typescript
async moveTask(taskId: string, targetColumnId: string, prevTaskId?: string, nextTaskId?: string) {
  return this.prisma.transaction(async (tx) => {
    await advisoryXactLock(tx, `column:${targetColumnId}:position`);

    const task = await this.taskRepository.findByIdOrThrow(taskId, tx);
    const prev = prevTaskId ? await this.taskRepository.findById(prevTaskId, tx) : null;
    const next = nextTaskId ? await this.taskRepository.findById(nextTaskId, tx) : null;

    let newPosition: number;
    if (prev && next) {
      newPosition = (prev.position + next.position) / 2;
      if (next.position - prev.position < 1e-7) {
        await rebalanceColumnInTx(tx, targetColumnId);
        return this.moveTask(taskId, targetColumnId, prevTaskId, nextTaskId);
      }
    } else if (prev && !next) {
      newPosition = prev.position + 1;
    } else if (!prev && next) {
      newPosition = next.position / 2;
    } else {
      newPosition = 1.0;
    }

    return this.taskRepository.update(
      taskId,
      { position: newPosition, columnId: targetColumnId },
      tx,
    );
  });
}
```

## Multi-step writes checklist

- [ ] All related reads/writes in one `$transaction`
- [ ] Advisory lock on the **column** before computing a new task position
- [ ] Row lock before contested delete (task/column/board-member)
- [ ] `@@unique([boardId, userId])` on `BoardMember` as safety net for invites
- [ ] Throw `ConflictException` / `NotFoundException` in service — filter maps Prisma errors to 409/404
- [ ] Access-control check (board membership) **before** acquiring any lock

## Prisma errors

`GlobalExceptionFilter` maps `P2002` → 409, `P2025` → 404. Do not swallow `P2002`.

## Do not

- Compute a move's new position outside a transaction
- Rely on `$transaction` alone for one membership per user/board without `@@unique`
- Lock per-task when contention is per-column
- Call Prisma for entity CRUD outside repositories — see [api-organization](../api-organization/SKILL.md)
- Auto-apply migrations in agent workflows — user runs `prisma migrate`
