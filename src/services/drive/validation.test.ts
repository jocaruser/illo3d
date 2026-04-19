import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APP_VERSION } from '@/config/version'
import { validateShopFolder } from './validation'

function parseMajor(version: string): number {
  const match = version.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

const mockReadMetadata = vi.fn()
const mockGetFolderName = vi.fn()

vi.mock('./folderRepository', () => ({
  getFolderRepository: vi.fn(() => ({
    readMetadata: mockReadMetadata,
    getFolderName: mockGetFolderName,
  })),
}))
vi.mock('@/services/sheets/validateStructure', () => ({
  validateStructure: vi.fn(),
}))
vi.mock('@/services/sheets/ensurePiecesSheetCanonicalRemote', () => ({
  ensurePiecesSheetCanonicalRemote: vi.fn().mockResolvedValue(undefined),
}))

import { validateStructure } from '@/services/sheets/validateStructure'

describe('validateShopFolder', () => {
  beforeEach(() => {
    mockReadMetadata.mockReset()
    mockGetFolderName.mockReset()
    mockGetFolderName.mockResolvedValue('folder-1')
    vi.mocked(validateStructure).mockReset()
  })

  it('returns not_shop when metadata is null', async () => {
    mockReadMetadata.mockResolvedValue(null)

    const result = await validateShopFolder('folder-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('not_shop')
  })

  it('returns version error when major version differs', async () => {
    mockReadMetadata.mockResolvedValue({
      app: 'illo3d',
      version: `${parseMajor(APP_VERSION) + 1}.0.0`,
      spreadsheetId: 'sheet-1',
      createdAt: '2026-01-01',
      createdBy: 'user@example.com',
    })

    const result = await validateShopFolder('folder-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('version')
  })

  it('returns structure error when sheet layout validation fails', async () => {
    mockReadMetadata.mockResolvedValue({
      app: 'illo3d',
      version: APP_VERSION,
      spreadsheetId: 'sheet-1',
      createdAt: '2026-01-01',
      createdBy: 'user@example.com',
    })
    vi.mocked(validateStructure).mockResolvedValue([
      { message: 'Missing sheet' },
    ])

    const result = await validateShopFolder('folder-1')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('structure')
      expect(result.detail).toBe('Missing sheet')
    }
  })
})
