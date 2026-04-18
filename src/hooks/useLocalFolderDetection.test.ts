import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLocalFolderDetection } from './useLocalFolderDetection'

describe('useLocalFolderDetection', () => {
  const win = window as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle | null>
  }

  afterEach(() => {
    delete win.showDirectoryPicker
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    win.showDirectoryPicker = vi.fn().mockResolvedValue(null)
  })

  it('returns null when user dismisses picker without a folder', async () => {
    const { result } = renderHook(() => useLocalFolderDetection())
    let out: Awaited<ReturnType<typeof result.current.pickFolder>> | null = null
    await act(async () => {
      out = await result.current.pickFolder()
    })
    expect(out).toBeNull()
  })

  it('throws when File System Access API is missing', async () => {
    delete win.showDirectoryPicker

    const { result } = renderHook(() => useLocalFolderDetection())
    await expect(
      act(async () => {
        await result.current.pickFolder()
      }),
    ).rejects.toThrow(/Chrome/i)
  })
})
