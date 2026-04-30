import { describe, it, expect } from 'vitest'
import { showDirectoryPicker, FILE_SYSTEM_ACCESS_NOT_SUPPORTED } from './directoryPicker'

describe('directoryPicker', () => {
  const win = window as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle | null>
  }

  it('exports FILE_SYSTEM_ACCESS_NOT_SUPPORTED with correct message', () => {
    expect(FILE_SYSTEM_ACCESS_NOT_SUPPORTED).toBe(
      'File System Access API is not supported in this browser. Please use a Chromium-based browser (Chrome, Edge, Brave, etc.).',
    )
  })

  it('showDirectoryPicker throws the shared constant when API is missing', async () => {
    const original = win.showDirectoryPicker
    delete win.showDirectoryPicker
    await expect(showDirectoryPicker()).rejects.toThrow(FILE_SYSTEM_ACCESS_NOT_SUPPORTED)
    win.showDirectoryPicker = original
  })
})
