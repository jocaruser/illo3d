import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import type { GlobalSearchHit, GlobalSearchRow } from '@/lib/globalSearch/types'
import { bodyContainsQuery, extractNoteSnippet } from '@/lib/globalSearch/noteSnippet'

export const GLOBAL_SEARCH_MAX_RESULTS = 10

function tieBreak(a: GlobalSearchRow, b: GlobalSearchRow): number {
  return `${a.hit.kind}\0${a.hit.id}`.localeCompare(`${b.hit.kind}\0${b.hit.id}`)
}

function attachSnippet(row: GlobalSearchRow, query: string): GlobalSearchHit {
  const q = query.trim()
  if (
    row.noteBody &&
    bodyContainsQuery(row.noteBody, q)
  ) {
    return {
      ...row.hit,
      snippet: extractNoteSnippet(row.noteBody, q),
    }
  }
  return row.hit
}

export function selectGlobalSearchResults(
  rows: GlobalSearchRow[],
  query: string
): GlobalSearchHit[] {
  const q = query.trim()
  if (q.length < 2) {
    return []
  }
  const matched = filterRowsBySearchQuery(rows, q, (r) => r.blob)
  const exact = matched.filter((r) => r.hit.id === q)
  const fuzzy = matched.filter((r) => r.hit.id !== q)
  exact.sort(tieBreak)
  fuzzy.sort(tieBreak)
  const merged = [...exact, ...fuzzy].slice(0, GLOBAL_SEARCH_MAX_RESULTS)
  return merged.map((r) => attachSnippet(r, q))
}
