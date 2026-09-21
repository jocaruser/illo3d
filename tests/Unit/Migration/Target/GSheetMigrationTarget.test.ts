import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGSheetMigrationTarget } from '@/Migration/Target/GSheetMigrationTarget'
import { FixedClock, shopMetadata } from '../helpers'

const h = vi.hoisted(() => {
  const calls: string[] = []
  return {
    calls,
    copyFile: vi.fn(async () => {
      calls.push('copyFile')
      return 'backup-copy-id'
    }),
    renameFile: vi.fn(async (fileId: string, newName: string) => {
      calls.push(`renameFile:${fileId}:${newName}`)
    }),
    deleteFile: vi.fn(async (fileId: string) => {
      calls.push(`deleteFile:${fileId}`)
    }),
    readMetadata: vi.fn(),
    writeMetadata: vi.fn(async () => {
      calls.push('writeMetadata')
    }),
    readSheetMatrix: vi.fn(async () => [['header'], ['row']]),
    replaceSheetMatrix: vi.fn(async () => {
      calls.push('replaceSheetMatrix')
    }),
    ensureSheet: vi.fn(async () => {}),
  }
})

vi.mock('@/Repository/GSheet/DriveFiles', () => ({
  copyFile: h.copyFile,
  renameFile: h.renameFile,
  deleteFile: h.deleteFile,
}))

vi.mock('@/Repository/GSheet/GDriveFolderRepository', () => ({
  GDriveFolderRepository: class {
    readMetadata = h.readMetadata
    writeMetadata = h.writeMetadata
  },
}))

vi.mock('@/Repository/GSheet/GSheetWorkbookRepository', () => ({
  GSheetWorkbookRepository: class {
    readSheetMatrix = h.readSheetMatrix
    replaceSheetMatrix = h.replaceSheetMatrix
    ensureSheet = h.ensureSheet
  },
}))

function makeTarget() {
  return createGSheetMigrationTarget(
    'folder-1',
    'source-sheet',
    '2.0.0',
    '3.0.0',
    new FixedClock('2026-07-16T10:00:00.000Z')
  )
}

describe('createGSheetMigrationTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.calls.length = 0
    h.readMetadata.mockResolvedValue({
      kind: 'present',
      metadata: shopMetadata('2.0.0'),
    })
  })

  it('writePreUpgradeBackup copies the source spreadsheet beside the shop', async () => {
    await makeTarget().writePreUpgradeBackup()
    expect(h.copyFile).toHaveBeenCalledExactlyOnceWith(
      'source-sheet',
      'illo3d-data.v2.0.0.backup',
      'folder-1'
    )
  })

  it('openSession loads the live spreadsheet into an in-memory repo', async () => {
    const session = await makeTarget().openSession()
    expect(session.ctx.backend).toBe('google-drive')
    expect(session.ctx.workingWorkbookId).toBe('source-sheet')
    await session.ctx.ensureSheet('audit_log')
    expect(
      await session.ctx.repo.getSheetNames(session.ctx.workingWorkbookId)
    ).toContain('audit_log')
  })

  it('submit writes sheets back and flips metadata without renaming spreadsheets', async () => {
    const session = await makeTarget().openSession()
    await session.submit({ keepOriginalAsBackup: true })
    expect(h.writeMetadata).toHaveBeenCalledExactlyOnceWith('folder-1', {
      ...shopMetadata('2.0.0'),
      version: '3.0.0',
      spreadsheetId: 'source-sheet',
    })
    expect(h.renameFile).not.toHaveBeenCalled()
    expect(h.deleteFile).not.toHaveBeenCalled()
    expect(h.replaceSheetMatrix).toHaveBeenCalled()
  })

  it('rejects submit when the folder has no metadata', async () => {
    const session = await makeTarget().openSession()
    h.readMetadata.mockResolvedValue({ kind: 'absent' })
    await expect(
      session.submit({ keepOriginalAsBackup: true })
    ).rejects.toThrow(/illo3d\.metadata\.json/)
    expect(h.writeMetadata).not.toHaveBeenCalled()
  })
})
