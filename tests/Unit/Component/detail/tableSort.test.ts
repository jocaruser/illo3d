import { act, renderHook } from '@testing-library/react'
import {
  compareEntityIds,
  compareSortValues,
  sortRows,
  useTableSort,
  type SortValue,
} from '@/Component/detail/tableSort'

interface Row {
  id: string
  label: SortValue
}

const rows: Row[] = [
  { id: 'CL2', label: 'beta' },
  { id: 'CL10', label: 'alpha' },
  { id: 'CL1', label: 'alpha' },
]

describe('compareEntityIds', () => {
  it('orders the numeric suffix numerically, not lexically', () => {
    expect(compareEntityIds('J2', 'J10')).toBeLessThan(0)
    expect(compareEntityIds('J10', 'J2')).toBeGreaterThan(0)
    expect(compareEntityIds('J2', 'J2')).toBe(0)
  })

  it('orders by prefix first', () => {
    expect(compareEntityIds('CL9', 'J1')).toBeLessThan(0)
  })

  it('falls back to a locale compare for ids without a numeric suffix', () => {
    expect(compareEntityIds('draft', 'alpha')).toBeGreaterThan(0)
    expect(compareEntityIds('alpha', 'draft')).toBeLessThan(0)
    // Only one side malformed still takes the fallback.
    expect(compareEntityIds('J1', 'nope')).toBeLessThan(0)
  })
})

describe('compareSortValues', () => {
  it('treats undefined and blank as equal', () => {
    expect(compareSortValues(undefined, '')).toBe(0)
    expect(compareSortValues('', undefined)).toBe(0)
  })

  it('sinks empty values below present ones', () => {
    expect(compareSortValues('', 'a')).toBe(1)
    expect(compareSortValues('a', '')).toBe(-1)
    expect(compareSortValues(undefined, 3)).toBe(1)
    expect(compareSortValues(3, undefined)).toBe(-1)
  })

  it('compares numbers numerically', () => {
    expect(compareSortValues(2, 10)).toBeLessThan(0)
  })

  it('compares strings with numeric collation', () => {
    expect(compareSortValues('item2', 'item10')).toBeLessThan(0)
  })

  it('compares mixed types as strings', () => {
    expect(compareSortValues(2, 'b')).toBeLessThan(0)
  })
})

describe('sortRows', () => {
  const cellOf = (row: Row) => row.label
  const idOf = (row: Row) => row.id

  it('breaks ties on the id, naturally', () => {
    const sorted = sortRows(rows, { key: 'label', dir: 'asc' }, cellOf, idOf)
    expect(sorted.map((row) => row.id)).toEqual(['CL1', 'CL10', 'CL2'])
  })

  it('reverses the tiebreak with the sort direction', () => {
    const sorted = sortRows(rows, { key: 'label', dir: 'desc' }, cellOf, idOf)
    expect(sorted.map((row) => row.id)).toEqual(['CL2', 'CL10', 'CL1'])
  })

  it('keeps empty cells last regardless of direction', () => {
    const withBlank: Row[] = [{ id: 'CL3', label: '' }, ...rows]
    expect(
      sortRows(withBlank, { key: 'label', dir: 'asc' }, cellOf, idOf).map((row) => row.id)
    ).toEqual(['CL1', 'CL10', 'CL2', 'CL3'])
    expect(
      sortRows(withBlank, { key: 'label', dir: 'desc' }, cellOf, idOf).map((row) => row.id)
    ).toEqual(['CL2', 'CL10', 'CL1', 'CL3'])
  })

  it('does not mutate the input', () => {
    const input = [...rows]
    sortRows(input, { key: 'label', dir: 'asc' }, cellOf, idOf)
    expect(input).toEqual(rows)
  })
})

describe('useTableSort', () => {
  it('reports a direction only for the active column', () => {
    const { result } = renderHook(() => useTableSort<'id' | 'name'>({ key: 'id', dir: 'asc' }))

    expect(result.current.directionFor('id')).toBe('asc')
    expect(result.current.directionFor('name')).toBeNull()

    act(() => result.current.toggle('name', 'desc'))
    expect(result.current.sort).toEqual({ key: 'name', dir: 'desc' })
    expect(result.current.directionFor('id')).toBeNull()
    expect(result.current.directionFor('name')).toBe('desc')
  })
})
