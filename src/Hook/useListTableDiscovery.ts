import { useMemo, useState } from 'react'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'

export type ListTableDiscoveryMessages = {
  collectionEmpty: string
  noMatches: string
}

export type UseListTableDiscoveryParams<T> = {
  sourceRows: T[]
  getSearchBlob: (row: T) => string
  messages: ListTableDiscoveryMessages
}

export type UseListTableDiscoveryResult<T> = {
  query: string
  setQuery: (query: string) => void
  rows: T[]
  emptyMessage: string
}

/**
 * Shared list-page search state: primary query, fuzzy filtering, and empty copy.
 */
export function useListTableDiscovery<T>({
  sourceRows,
  getSearchBlob,
  messages,
}: UseListTableDiscoveryParams<T>): UseListTableDiscoveryResult<T> {
  const [query, setQuery] = useState('')

  const rows = useMemo(
    () => fuzzyFilter(sourceRows, query, getSearchBlob),
    [sourceRows, query, getSearchBlob]
  )

  const emptyMessage =
    sourceRows.length === 0 ? messages.collectionEmpty : messages.noMatches

  return { query, setQuery, rows, emptyMessage }
}
