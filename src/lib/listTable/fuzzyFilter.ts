import Fuse from 'fuse.js'
import type { IFuseOptions } from 'fuse.js'

const fuseOptions: IFuseOptions<{ blob: string }> = {
  keys: ['blob'],
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

type Indexed<T> = { row: T; blob: string }

/** ISO-like date fragment: require literal substring (avoids fuzzy month cross-match). */
const strictDateOrMonthQuery = /^\d{4}-\d{2}(-\d{2})?$/

/**
 * Client-side fuzzy filter. Trims query; if fewer than 2 characters, returns rows unchanged.
 */
export function filterRowsBySearchQuery<T>(
  rows: T[],
  query: string,
  getBlob: (row: T) => string
): T[] {
  const q = query.trim()
  if (q.length < 2) {
    return rows
  }
  if (strictDateOrMonthQuery.test(q)) {
    return rows.filter((row) => getBlob(row).includes(q))
  }
  const indexed: Indexed<T>[] = rows.map((row) => ({
    row,
    blob: getBlob(row),
  }))
  const fuse = new Fuse(indexed, fuseOptions)
  return fuse.search(q).map((hit) => hit.item.row)
}
