import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkbookConnection } from './useWorkbookConnection'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'

const mockRepo = { readSheetMatrix: vi.fn(), getSheetIdMap: vi.fn() }

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => mockRepo,
}))

describe('useWorkbookConnection', () => {
  beforeEach(() => {
    useShopStore.setState({ activeShop: null })
    useWorkbookStore.getState().reset()
    vi.clearAllMocks()
  })

  it('onRetry is a no-op when spreadsheetId is null', () => {
    const hydrateSpy = vi.spyOn(useWorkbookStore.getState(), 'hydrate')

    const { result } = renderHook(() => useWorkbookConnection())

    act(() => {
      result.current.onRetry()
    })

    expect(hydrateSpy).not.toHaveBeenCalled()
  })

  it('onRetry calls hydrate with repository and spreadsheetId', () => {
    const hydrateSpy = vi
      .spyOn(useWorkbookStore.getState(), 'hydrate')
      .mockResolvedValue(undefined)
    useShopStore.setState({
      activeShop: {
        folderId: 'f',
        folderName: 'n',
        spreadsheetId: 'sheet-abc',
        metadataVersion: '1.0.0',
      },
    })

    const { result } = renderHook(() => useWorkbookConnection())

    act(() => {
      result.current.onRetry()
    })

    expect(hydrateSpy).toHaveBeenCalledTimes(1)
    expect(hydrateSpy).toHaveBeenCalledWith(mockRepo, 'sheet-abc')
  })
})
