import type { JobStatusSelectResult } from '@/hooks/useJobStatusFlow'

/**
 * When a kanban drop requested a confirmation dialog but pricing rules block the transition,
 * clear the pending placement ref so later drags are not paired with a stale commit.
 */
export function clearKanbanPendingAfterSelect(
  selectResult: JobStatusSelectResult | undefined,
  pendingRef: { current: unknown },
): void {
  if (selectResult === 'blocked') pendingRef.current = null
}
