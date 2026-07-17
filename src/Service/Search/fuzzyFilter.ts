import Fuse, { type IFuseOptions } from 'fuse.js'

const fuseOptions: IFuseOptions<{ blob: string }> = {
  keys: ['blob'],
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

/** `YYYY-MM` / `YYYY-MM-DD` queries match literally (fuzzy months cross-match). */
const strictDateOrMonthQuery = /^\d{4}-\d{2}(-\d{2})?$/

/**
 * Fuzzy filter over pre-built search blobs. Queries shorter than 2 characters
 * pass every row through unchanged.
 */
export function fuzzyFilter<T>(
  rows: T[],
  query: string,
  getBlob: (row: T) => string
): T[] {
  const trimmed = query.trim()
  if (trimmed.length < 2) return rows
  if (strictDateOrMonthQuery.test(trimmed)) {
    return rows.filter((row) => {
      const blob = getBlob(row)
      return blob.includes(trimmed)
    })
  }
  const indexed = rows.map((row) => ({ row, blob: getBlob(row) }))
  const fuse = new Fuse(indexed, fuseOptions)
  return fuse.search(trimmed).map((hit) => hit.item.row)
}
