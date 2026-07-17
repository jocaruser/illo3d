import { useCallback, useMemo, useState } from 'react'
import type { SortDirection } from '@/Component/table/SortableColumnHeader'

export type SortDir = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  dir: SortDir
}

/** A sortable cell value; `undefined` always sorts last regardless of direction. */
export type SortValue = string | number | undefined

const ID_PATTERN = /^([A-Za-z]*)(\d+)$/

/**
 * Natural order for prefixed workbook ids: letters first, then the numeric
 * suffix numerically (so `J2` precedes `J10`). Non-conforming ids fall back to
 * a plain locale compare.
 */
export function compareEntityIds(a: string, b: string): number {
  const left = ID_PATTERN.exec(a)
  const right = ID_PATTERN.exec(b)
  if (left === null || right === null) return a.localeCompare(b)
  if (left[1] !== right[1]) return left[1].localeCompare(right[1])
  return Number(left[2]) - Number(right[2])
}

/** Compares two cells; blanks and `undefined` sink to the bottom of the list. */
export function compareSortValues(a: SortValue, b: SortValue): number {
  const aEmpty = a === undefined || a === ''
  const bEmpty = b === undefined || b === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * Sort rows by the active column with a stable id tiebreak. Empty cells stay at
 * the bottom in both directions so a descending sort never leads with blanks.
 */
export function sortRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  cellOf: (row: T, key: K) => SortValue,
  idOf: (row: T) => string
): T[] {
  const factor = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = cellOf(a, sort.key)
    const right = cellOf(b, sort.key)
    const cells = compareSortValues(left, right)
    if (cells !== 0) {
      const bothPresent = left !== undefined && left !== '' && right !== undefined && right !== ''
      return bothPresent ? cells * factor : cells
    }
    return compareEntityIds(idOf(a), idOf(b)) * factor
  })
}

export interface TableSort<K extends string> {
  sort: SortState<K>
  /** Direction to hand `SortableColumnHeader` for `key` (null when inactive). */
  directionFor(key: K): SortDirection
  toggle(key: K, next: SortDir): void
}

/** Single-column sort state for a list table. */
export function useTableSort<K extends string>(initial: SortState<K>): TableSort<K> {
  const [sort, setSort] = useState<SortState<K>>(initial)
  const directionFor = useCallback(
    (key: K): SortDirection => (sort.key === key ? sort.dir : null),
    [sort]
  )
  const toggle = useCallback((key: K, next: SortDir) => setSort({ key, dir: next }), [])
  return useMemo(() => ({ sort, directionFor, toggle }), [sort, directionFor, toggle])
}
