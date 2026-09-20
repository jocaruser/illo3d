import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useListTableDiscovery } from '@/Hook/useListTableDiscovery'

interface Row {
  id: string
  blob: string
}

const sourceRows: Row[] = [
  { id: 'a', blob: 'Acme lamp 2026-06-01' },
  { id: 'b', blob: 'Bracket PLA' },
]

const messages = {
  collectionEmpty: 'collection-empty',
  noMatches: 'no-matches',
}

describe('useListTableDiscovery', () => {
  it('passes all source rows when the query is shorter than two characters', () => {
    const { result } = renderHook(() =>
      useListTableDiscovery({
        sourceRows,
        getSearchBlob: (row) => row.blob,
        messages,
      })
    )

    act(() => {
      result.current.setQuery('a')
    })

    expect(result.current.rows).toEqual(sourceRows)
  })

  it('uses noMatches when the collection is non-empty but filtered to zero', () => {
    const { result } = renderHook(() =>
      useListTableDiscovery({
        sourceRows,
        getSearchBlob: (row) => row.blob,
        messages,
      })
    )

    act(() => {
      result.current.setQuery('zzzz')
    })

    expect(result.current.rows).toEqual([])
    expect(result.current.emptyMessage).toBe('no-matches')
  })

  it('uses collectionEmpty when sourceRows is empty', () => {
    const { result } = renderHook(() =>
      useListTableDiscovery({
        sourceRows: [],
        getSearchBlob: (row) => row.blob,
        messages,
      })
    )

    expect(result.current.emptyMessage).toBe('collection-empty')
  })

  it('filters YYYY-MM queries with literal matching via fuzzyFilter', () => {
    const { result } = renderHook(() =>
      useListTableDiscovery({
        sourceRows,
        getSearchBlob: (row) => row.blob,
        messages,
      })
    )

    act(() => {
      result.current.setQuery('2026-06')
    })

    expect(result.current.rows.map((row) => row.id)).toEqual(['a'])
  })
})
