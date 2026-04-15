export type SortDirection = 'asc' | 'desc'

export function compareWithStableIdTiebreak(
  a: string | number,
  b: string | number,
  direction: SortDirection,
  idA: string,
  idB: string
): number {
  const primaryMul = direction === 'asc' ? 1 : -1
  let cmp = 0
  if (typeof a === 'number' && typeof b === 'number') {
    if (a < b) cmp = -1
    else if (a > b) cmp = 1
  } else {
    const sa = String(a)
    const sb = String(b)
    if (sa < sb) cmp = -1
    else if (sa > sb) cmp = 1
  }
  if (cmp !== 0) {
    return cmp * primaryMul
  }
  return idA.localeCompare(idB)
}

export function sortRowsByColumn<T>(
  rows: T[],
  getId: (row: T) => string,
  columnKey: string,
  direction: SortDirection,
  getComparable: (row: T, key: string) => string | number
): T[] {
  return [...rows].sort((x, y) =>
    compareWithStableIdTiebreak(
      getComparable(x, columnKey),
      getComparable(y, columnKey),
      direction,
      getId(x),
      getId(y)
    )
  )
}
