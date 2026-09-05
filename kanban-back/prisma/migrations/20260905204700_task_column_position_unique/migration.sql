-- Deduplicate positions per column so the unique index can be added.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "columnId"
      ORDER BY "position" ASC, id ASC
    ) AS rn
  FROM "Task"
)
UPDATE "Task" AS t
SET "position" = -ranked.rn
FROM ranked
WHERE t.id = ranked.id;

UPDATE "Task"
SET "position" = -"position";

-- CreateIndex
CREATE UNIQUE INDEX "Task_columnId_position_key" ON "Task"("columnId", "position");
