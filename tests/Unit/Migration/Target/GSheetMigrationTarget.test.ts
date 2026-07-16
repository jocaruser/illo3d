import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { createGSheetMigrationTarget } from '@/Migration/Target/GSheetMigrationTarget'
import { FixedClock, shopMetadata } from '../helpers'

const h = vi.hoisted(() => {
  const calls: string[] = []
  return {
    calls,
    copyFile: vi.fn(async () => {
      calls.push('copyFile')
      return 'working-id'
    }),
    renameFile: vi.fn(async (fileId: string, newName: string) => {
      calls.push(`renameFile:${fileId}:${newName}`)
    }),
    deleteFile: vi.fn(async (fileId: string) => {
      calls.push(`deleteFile:${fileId}`)
    }),
    readMetadata: vi.fn<() => Promise<ShopMetadata | null>>(),
    writeMetadata: vi.fn(async () => {
      calls.push('writeMetadata')
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
    h.readMetadata.mockResolvedValue(shopMetadata('2.0.0'))
  })

  it('copies the source spreadsheet into a named working copy in the shop folder', async () => {
    const working = await makeTarget().createWorkingCopy()
    expect(h.copyFile).toHaveBeenCalledExactlyOnceWith(
      'source-sheet',
      'illo3d-data.v2.0.0.v3.0.0.migration',
      'folder-1'
    )
    expect(working.ctx.backend).toBe('google-drive')
    expect(working.ctx.workingWorkbookId).toBe('working-id')
  })

  it('delegates ensureSheet to the repo with the working spreadsheet id', async () => {
    const working = await makeTarget().createWorkingCopy()
    await working.ctx.ensureSheet('audit_log')
    expect(h.ensureSheet).toHaveBeenCalledExactlyOnceWith(
      'working-id',
      'audit_log'
    )
  })

  it('commits atomically: metadata write strictly before any rename', async () => {
    const working = await makeTarget().createWorkingCopy()
    await working.commit({ keepOriginalAsBackup: true })
    expect(h.calls).toEqual([
      'copyFile',
      'writeMetadata',
      'renameFile:working-id:illo3d-data',
      'renameFile:source-sheet:illo3d-data.v2.0.0.backup',
    ])
  })

  it('preserves unrelated metadata fields while flipping version and spreadsheetId', async () => {
    const working = await makeTarget().createWorkingCopy()
    await working.commit({ keepOriginalAsBackup: true })
    expect(h.writeMetadata).toHaveBeenCalledExactlyOnceWith('folder-1', {
      ...shopMetadata('2.0.0'),
      version: '3.0.0',
      spreadsheetId: 'working-id',
    })
  })

  it('deletes the source spreadsheet after the renames when no backup is kept', async () => {
    const working = await makeTarget().createWorkingCopy()
    await working.commit({ keepOriginalAsBackup: false })
    expect(h.calls).toEqual([
      'copyFile',
      'writeMetadata',
      'renameFile:working-id:illo3d-data',
      'deleteFile:source-sheet',
    ])
  })

  it('rejects the commit before writing anything when the folder has no metadata', async () => {
    const working = await makeTarget().createWorkingCopy()
    h.readMetadata.mockResolvedValue(null)
    await expect(
      working.commit({ keepOriginalAsBackup: true })
    ).rejects.toThrow(/illo3d\.metadata\.json/)
    expect(h.writeMetadata).not.toHaveBeenCalled()
    expect(h.renameFile).not.toHaveBeenCalled()
    expect(h.deleteFile).not.toHaveBeenCalled()
  })
})
