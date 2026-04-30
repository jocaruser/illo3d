import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCreateShop } from './useCreateShop'
import { FILE_SYSTEM_ACCESS_NOT_SUPPORTED } from '@/services/local/directoryPicker'
import { useBackendStore } from '@/stores/backendStore'

describe('useCreateShop', () => {
  const win = window as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle | null>
  }

  beforeEach(() => {
    win.showDirectoryPicker = vi.fn().mockResolvedValue(null)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    useBackendStore.getState().reset()
  })

  it('throws shared constant when File System Access API is missing on local-csv create', async () => {
    delete win.showDirectoryPicker
    useBackendStore.setState({ backend: 'local-csv' })

    const { result } = renderHook(() => useCreateShop())
    await expect(
      result.current.createShop('test-shop'),
    ).rejects.toThrow(FILE_SYSTEM_ACCESS_NOT_SUPPORTED)
  })
})
