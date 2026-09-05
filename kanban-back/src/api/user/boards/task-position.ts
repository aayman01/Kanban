const MIN_GAP = 1e-4;

export function midpoint(
  prevPosition?: number,
  nextPosition?: number,
): number | 'rebalance' {
  if (prevPosition == null && nextPosition == null) {
    return 1;
  }
  if (prevPosition == null) {
    const next = nextPosition!;
    const position = next / 2;
    if (next <= 0 || position === next) {
      return 'rebalance';
    }
    return position;
  }
  if (nextPosition == null) {
    return prevPosition + 1;
  }
  if (nextPosition - prevPosition < MIN_GAP) {
    return 'rebalance';
  }
  const position = (prevPosition + nextPosition) / 2;
  if (position === prevPosition || position === nextPosition) {
    return 'rebalance';
  }
  return position;
}

export function neighborsAreAdjacent(
  destTasks: Array<{ id: string }>,
  movingTaskId: string,
  prevTaskId: string | null,
  nextTaskId: string | null,
): boolean {
  const ordered = destTasks.filter((task) => task.id !== movingTaskId);
  const prevIndex = prevTaskId
    ? ordered.findIndex((task) => task.id === prevTaskId)
    : -1;
  const nextIndex = nextTaskId
    ? ordered.findIndex((task) => task.id === nextTaskId)
    : -1;

  if (prevTaskId && prevIndex < 0) {
    return false;
  }
  if (nextTaskId && nextIndex < 0) {
    return false;
  }
  if (!prevTaskId && !nextTaskId) {
    return ordered.length === 0;
  }
  if (!prevTaskId) {
    return nextIndex === 0;
  }
  if (!nextTaskId) {
    return prevIndex === ordered.length - 1;
  }
  return nextIndex === prevIndex + 1;
}
