import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMigration } from './useMigration'
import { runPlan } from '@/services/migration/orchestrator'
import { resolvePlanChain } from '@/services/migration/registry'
import { createLocalMigrationTarget } from '@/services/migration/backup/localBackup'
import { createDriveMigrationTarget } from '@/services/migration/backup/driveBackup'
import { getFolderRepository } from '@/services/drive/folderRepository'
import { useBackendStore } from '@/stores/backendStore'
import { useMigrationStore } from '@/stores/migrationStore'

vi.mock('@/services/migration/orchestrator', async () => {
  const actual = await vi.importActual('@/services/migration/orchestrator')
  return { ...actual, runPlan: vi.fn() }
})

vi.mock('@/services/migration/registry', () => ({
  resolvePlanChain: vi.fn(),
}))

vi.mock('@/services/migration/backup/localBackup', () => ({
  createLocalMigrationTarget: vi.fn(() => ({ kind: 'local-target' })),
}))

vi.mock('@/services/migration/backup/driveBackup', () => ({
  createDriveMigrationTarget: vi.fn(() => ({ kind: 'drive-target' })),
}))

vi.mock('@/services/drive/folderRepository', () => ({
  getFolderRepository: vi.fn(),
}))

const validateAndSetShop = vi.fn()
vi.mock('@/hooks/useOpenExistingShop', () => ({
  useOpenExistingShop: () => ({ validateAndSetShop }),
}))

const runPlanMock = vi.mocked(runPlan)
const resolvePlanChainMock = vi.mocked(resolvePlanChain)
const getFolderRepositoryMock = vi.mocked(getFolderRepository)

const METADATA = {
  app: 'illo3d',
  version: '1.5.0',
  spreadsheetId: 'sheet-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  createdBy: 'dev@illo3d.local',
}

const PLAN = {
  fromMajor: 1,
  toMajor: 2,
  toVersion: '2.0.0',
  steps: [{ id: 'clients' }, { id: 'audit_log' }],
} as unknown as ReturnType<typeof resolvePlanChain>[number]

function startParams(keepOriginalAsBackup = true) {
  return { folderId: 'folder-1', shopVersion: '1.5.0', keepOriginalAsBackup }
}

beforeEach(() => {
  vi.clearAllMocks()
  useMigrationStore.getState().reset()
  useBackendStore.setState({ backend: 'local-csv', localDirectoryHandle: {} as FileSystemDirectoryHandle })
  resolvePlanChainMock.mockReturnValue([PLAN])
  runPlanMock.mockResolvedValue({ success: true })
  validateAndSetShop.mockResolvedValue({ ok: true })
  getFolderRepositoryMock.mockReturnValue({
    readMetadata: vi.fn(async () => METADATA),
    getFolderName: vi.fn(async () => 'shop'),
  })
})

describe('useMigration', () => {
  it('seeds the store with a pending backup card and plan steps', async () => {
    const { result } = renderHook(() => useMigration())
    await result.current.start(startParams(true))

    expect(resolvePlanChainMock).toHaveBeenCalledWith(1, 2)
    const seeded = useMigrationStore.getState().steps
    expect(seeded.map((step) => step.id)).toEqual([
      'backup',
      'clients',
      'audit_log',
    ])
    expect(seeded[0].status).toBe('pending')
  })

  it('seeds the backup card as done/skipped when the backup is skipped', async () => {
    const { result } = renderHook(() => useMigration())
    await result.current.start(startParams(false))

    const backup = useMigrationStore.getState().steps[0]
    expect(backup.status).toBe('done')
    expect(backup.description).toBe('wizard.migrationBackupSkipped')
  })

  it('builds a local target when the backend is local-csv', async () => {
    const { result } = renderHook(() => useMigration())
    await result.current.start(startParams())

    expect(createLocalMigrationTarget).toHaveBeenCalledWith(
      expect.objectContaining({ fromVersion: '1.5.0', toVersion: '2.0.0' })
    )
    expect(runPlanMock).toHaveBeenCalledWith(
      PLAN,
      { kind: 'local-target' },
      expect.anything(),
      { keepOriginalAsBackup: true }
    )
  })

  it('builds a drive target when the backend is google-drive', async () => {
    useBackendStore.setState({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    const { result } = renderHook(() => useMigration())
    await result.current.start(startParams())

    expect(createDriveMigrationTarget).toHaveBeenCalledWith({
      folderId: 'folder-1',
      spreadsheetId: 'sheet-1',
      fromVersion: '1.5.0',
      toVersion: '2.0.0',
    })
  })

  it('opens the migrated shop after a successful run', async () => {
    const { result } = renderHook(() => useMigration())
    const outcome = await result.current.start(startParams())

    expect(outcome).toEqual({ success: true })
    expect(validateAndSetShop).toHaveBeenCalledWith('folder-1')
  })

  it('does not open the shop when a plan fails', async () => {
    runPlanMock.mockResolvedValue({ success: false, failedAt: 'clients' })
    const { result } = renderHook(() => useMigration())
    const outcome = await result.current.start(startParams())

    expect(outcome).toEqual({ success: false })
    expect(validateAndSetShop).not.toHaveBeenCalled()
  })

  it('fails the run when no migration path exists', async () => {
    resolvePlanChainMock.mockImplementation(() => {
      throw new Error('No migration path from v0 to v2')
    })
    const { result } = renderHook(() => useMigration())
    const outcome = await result.current.start({
      folderId: 'folder-1',
      shopVersion: '0.9.0',
      keepOriginalAsBackup: true,
    })

    expect(outcome).toEqual({ success: false })
    expect(useMigrationStore.getState().phase).toBe('failed')
    expect(useMigrationStore.getState().failureMessage).toContain(
      'No migration path'
    )
  })

  it('fails the run when the migrated shop does not validate', async () => {
    validateAndSetShop.mockResolvedValue({ ok: false, error: 'structure' })
    const { result } = renderHook(() => useMigration())
    const outcome = await result.current.start(startParams())

    expect(outcome).toEqual({ success: false })
    expect(useMigrationStore.getState().phase).toBe('failed')
  })
})
