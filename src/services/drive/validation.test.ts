import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateShopFolder } from './validation'

vi.mock('./metadata', () => ({
  readMetadata: vi.fn(),
}))
vi.mock('./client', () => ({
  driveFetch: vi.fn(),
}))
vi.mock('@/services/sheets/validateStructure', () => ({
  validateStructure: vi.fn(),
}))
vi.mock('@/services/sheets/client', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
}))

import { readMetadata } from './metadata'
import { validateStructure } from '@/services/sheets/validateStructure'

describe('validateShopFolder', () => {
  beforeEach(() => {
    vi.mocked(readMetadata).mockReset()
    vi.mocked(validateStructure).mockReset()
  })

  it('returns not_shop when metadata is null', async () => {
    vi.mocked(readMetadata).mockResolvedValue(null)

    const result = await validateShopFolder('folder-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('not_shop')
  })

  it('returns version error when major version differs', async () => {
    vi.mocked(readMetadata).mockResolvedValue({
      app: 'illo3d',
      version: '2.0.0',
      spreadsheetId: 'sheet-1',
      createdAt: '2026-01-01',
      createdBy: 'user@example.com',
    })

    const result = await validateShopFolder('folder-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('version')
  })

  it('returns permissions error when structure validation fails', async () => {
    vi.mocked(readMetadata).mockResolvedValue({
      app: 'illo3d',
      version: '1.0.0',
      spreadsheetId: 'sheet-1',
      createdAt: '2026-01-01',
      createdBy: 'user@example.com',
    })
    vi.mocked(validateStructure).mockResolvedValue([
      { message: 'Missing sheet' },
    ])

    const result = await validateShopFolder('folder-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('permissions')
  })
})
