import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOpenExistingShop } from './useOpenExistingShop'
import { FILE_SYSTEM_ACCESS_NOT_SUPPORTED } from '@/services/local/directoryPicker'

describe('useOpenExistingShop', () => {
  const win = window as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle | null>
  }

  beforeEach(() => {
    win.showDirectoryPicker = vi.fn().mockResolvedValue(null)
  })

  it('throws shared constant when File System Access API is missing', async () => {
    delete win.showDirectoryPicker

    const { result } = renderHook(() => useOpenExistingShop())
    await expect(
      result.current.selectLocalFolder(),
    ).rejects.toThrow(FILE_SYSTEM_ACCESS_NOT_SUPPORTED)
  })
})
