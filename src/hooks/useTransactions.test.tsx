import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTransactions } from './useTransactions'

vi.mock('@/services/sheets/client', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
}))

vi.mock('@/services/sheets/transactions', () => ({
  fetchTransactions: vi.fn().mockResolvedValue([]),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when spreadsheetId is null', () => {
    const { result } = renderHook(() => useTransactions(null), {
      wrapper: createWrapper(),
    })
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('fetches when spreadsheetId is provided', async () => {
    const { fetchTransactions } = await import('@/services/sheets/transactions')
    const { result } = renderHook(() => useTransactions('spreadsheet-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchTransactions).toHaveBeenCalledWith('spreadsheet-123')
    expect(result.current.data).toEqual([])
  })
})
