import { useMemo } from 'react'
import { createEntityManager, type EntityManager } from '@/Repository/EntityManager'
import { useWorkbookStore } from '@/Store/workbookStore'

/**
 * An `EntityManager` over the live workbook snapshot.
 *
 * The `tabs` object is the memo key rather than a value the hook reads: every
 * mutation replaces the snapshot identity, so keying on it hands components a
 * fresh EntityManager (and therefore fresh reads) exactly when the data
 * changed, and a stable one otherwise.
 */
export function useEntityManager(): EntityManager {
  const tabs = useWorkbookStore((state) => state.tabs)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `tabs` is the cache key, not an input
  return useMemo(() => createEntityManager(), [tabs])
}
