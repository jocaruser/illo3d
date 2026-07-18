import { act, renderHook } from '@testing-library/react'
import { APP_VERSION } from '@/Config/version'
import {
  BACKUP_SKIPPED_KEY,
  migrationStepIds,
  useMigration,
} from '@/Hook/useMigration'
import { useBackendStore } from '@/Store/backendStore'
import { useMigrationStore } from '@/Store/migrationStore'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

const {
  resolvePlanChain,
  runPlans,
  createLocalCsvMigrationTarget,
  createGSheetMigrationTarget,
  readMetadata,
  validateShopFolder,
  hydrate,
} = vi.hoisted(() => ({
  resolvePlanChain: vi.fn(),
  runPlans: vi.fn(),
  createLocalCsvMigrationTarget: vi.fn(() => ({ kind: 'local-target' })),
  createGSheetMigrationTarget: vi.fn(() => ({ kind: 'gsheet-target' })),
  readMetadata: vi.fn(),
  validateShopFolder: vi.fn(),
  hydrate: vi.fn(),
}))

vi.mock('@/Migration/registry', () => ({ resolvePlanChain }))
vi.mock('@/Migration/orchestrator', () => ({ runPlans }))
vi.mock('@/Migration/Target/LocalCsvMigrationTarget', () => ({
  createLocalCsvMigrationTarget,
}))
vi.mock('@/Migration/Target/GSheetMigrationTarget', () => ({
  createGSheetMigrationTarget,
}))
vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(() => ({ readMetadata })),
  getWorkbookRepository: vi.fn(() => ({})),
}))
vi.mock('@/Service/ShopValidationService', () => ({
  ShopValidationService: vi.fn(function () {
    return { validateShopFolder }
  }),
}))
vi.mock('@/Service/WorkbookService', () => ({
  WorkbookService: vi.fn(function () {
    return { hydrate }
  }),
}))

const clock = { now: () => new Date('2026-07-16T10:00:00.000Z') }

const handle = { name: 'my-shop' } as unknown as FileSystemDirectoryHandle

const shop = {
  folderId: 'F1',
  folderName: 'illo3d',
  spreadsheetId: 'SS-NEW',
  metadataVersion: '3.0.0',
}

/** v1→v3 chain: 'jobs' appears in both plans but is one grid row. */
const v1Chain = [
  {
    fromMajor: 1,
    toMajor: 2,
    toVersion: '2.0.0',
    steps: [{ id: 'clients' }, { id: 'jobs' }],
  },
  {
    fromMajor: 2,
    toMajor: 3,
    toVersion: '3.0.0',
    steps: [{ id: 'jobs' }, { id: 'inventory' }],
  },
]

const args = {
  folderId: 'F1',
  shopVersion: '2.0.0',
  keepOriginalAsBackup: true,
}

describe('migrationStepIds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolvePlanChain.mockReturnValue(v1Chain)
  })

  it('leads with backup and dedupes ids repeated across chained plans', () => {
    expect(migrationStepIds('1.0.0')).toEqual([
      'backup',
      'clients',
      'jobs',
      'inventory',
    ])
  })

  it('degrades to the backup row alone when the chain cannot be resolved', () => {
    resolvePlanChain.mockImplementation(() => {
      throw new Error('No migration plan found from v9')
    })
    expect(migrationStepIds('9.0.0')).toEqual(['backup'])
  })

  it('degrades to the backup row alone for an unparseable version', () => {
    expect(migrationStepIds('not-a-version')).toEqual(['backup'])
    expect(resolvePlanChain).not.toHaveBeenCalled()
  })
})

describe('useMigration', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    resolvePlanChain.mockReturnValue(v1Chain)
    runPlans.mockResolvedValue({ ok: true })
    readMetadata.mockResolvedValue({ spreadsheetId: 'SS-OLD' })
    validateShopFolder.mockResolvedValue({ ok: true, shop, metadata: {} })
    hydrate.mockResolvedValue(undefined)
    useMigrationStore.getState().reset()
    useShopStore.setState({ activeShop: null })
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exposes the store as its progress surface', () => {
    const { result } = renderHook(() => useMigration(clock))
    expect(result.current.phase).toBe('idle')
    expect(result.current.steps).toEqual([])
    expect(result.current.failureMessage).toBeNull()
  })

  it('builds a local target from the directory handle and enters the migrated shop', async () => {
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start(args)
    })

    expect(createLocalCsvMigrationTarget).toHaveBeenCalledWith(
      handle,
      '2.0.0',
      APP_VERSION,
      clock
    )
    expect(runPlans).toHaveBeenCalledWith(
      v1Chain,
      { kind: 'local-target' },
      {
        keepOriginalAsBackup: true,
      }
    )
    expect(validateShopFolder).toHaveBeenCalledWith('F1')
    expect(hydrate).toHaveBeenCalledTimes(1)
    expect(useShopStore.getState().activeShop).toEqual(shop)
    expect(outcome).toEqual({ ok: true })
  })

  it('reads the spreadsheet id from the shop metadata to build a Drive target', async () => {
    useBackendStore.setState({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    const { result } = renderHook(() => useMigration(clock))

    await act(async () => {
      await result.current.start(args)
    })

    expect(readMetadata).toHaveBeenCalledWith('F1')
    expect(createGSheetMigrationTarget).toHaveBeenCalledWith(
      'F1',
      'SS-OLD',
      '2.0.0',
      APP_VERSION,
      clock
    )
    expect(runPlans).toHaveBeenCalledWith(
      v1Chain,
      { kind: 'gsheet-target' },
      {
        keepOriginalAsBackup: true,
      }
    )
  })

  it('seeds the grid before running, marking backup skipped when declined', async () => {
    // Freeze the store the moment runPlans is entered, before it re-seeds.
    let seeded: unknown
    runPlans.mockImplementation(async () => {
      seeded = useMigrationStore.getState().steps
      return { ok: true }
    })
    const { result } = renderHook(() => useMigration(clock))

    await act(async () => {
      await result.current.start({ ...args, keepOriginalAsBackup: false })
    })

    expect(seeded).toEqual([
      { id: 'backup', status: 'done', description: BACKUP_SKIPPED_KEY },
      { id: 'clients', status: 'pending' },
      { id: 'jobs', status: 'pending' },
      { id: 'inventory', status: 'pending' },
    ])
  })

  it('leaves the backup row pending when a backup was requested', async () => {
    let seeded: unknown
    runPlans.mockImplementation(async () => {
      seeded = useMigrationStore.getState().steps
      return { ok: true }
    })
    const { result } = renderHook(() => useMigration(clock))

    await act(async () => {
      await result.current.start(args)
    })

    expect(seeded).toContainEqual({ id: 'backup', status: 'pending' })
  })

  it('fails before running when the plan chain cannot be resolved', async () => {
    resolvePlanChain.mockImplementation(() => {
      throw new Error('Cannot migrate downward from v4 to v3')
    })
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start({ ...args, shopVersion: '4.0.0' })
    })

    expect(runPlans).not.toHaveBeenCalled()
    expect(outcome).toEqual({ ok: false, failedAt: 'backup' })
    expect(result.current.phase).toBe('failed')
    expect(result.current.failureMessage).toBe(
      'Cannot migrate downward from v4 to v3'
    )
  })

  it('fails before running for an unparseable shop version', async () => {
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start({ ...args, shopVersion: 'v-old' })
    })

    expect(outcome).toEqual({ ok: false, failedAt: 'backup' })
    expect(result.current.failureMessage).toContain("versioned 'v-old'")
  })

  it('fails when the Drive folder holds no shop metadata', async () => {
    useBackendStore.setState({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    readMetadata.mockResolvedValue(null)
    const { result } = renderHook(() => useMigration(clock))

    await act(async () => {
      await result.current.start(args)
    })

    expect(runPlans).not.toHaveBeenCalled()
    expect(result.current.failureMessage).toBe(
      "Folder 'F1' is not an illo3d shop"
    )
  })

  it('fails when no backend is selected', async () => {
    useBackendStore.setState({ backend: null, localDirectoryHandle: null })
    const { result } = renderHook(() => useMigration(clock))

    await act(async () => {
      await result.current.start(args)
    })

    expect(result.current.failureMessage).toBe('No backend selected')
  })

  it('fails when the local backend lost its directory handle', async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: null,
    })
    const { result } = renderHook(() => useMigration(clock))

    await act(async () => {
      await result.current.start(args)
    })

    expect(result.current.failureMessage).toBe('No backend selected')
  })

  it('returns the orchestrator failure untouched and never enters the shop', async () => {
    runPlans.mockResolvedValue({ ok: false, failedAt: 'jobs' })
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start(args)
    })

    expect(outcome).toEqual({ ok: false, failedAt: 'jobs' })
    expect(validateShopFolder).not.toHaveBeenCalled()
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('fails when the migrated shop does not re-validate', async () => {
    validateShopFolder.mockResolvedValue({
      ok: false,
      error: 'structure',
      detail: 'bad',
    })
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start(args)
    })

    expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
    expect(result.current.phase).toBe('failed')
    expect(result.current.failureMessage).toBe(
      'Migrated shop failed validation (structure)'
    )
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('fails when hydrating the migrated shop throws', async () => {
    hydrate.mockRejectedValue(new Error('sheet unreachable'))
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start(args)
    })

    expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
    expect(result.current.failureMessage).toBe('sheet unreachable')
  })

  it('defaults to a system clock when none is injected', async () => {
    const { result } = renderHook(() => useMigration())

    await act(async () => {
      await result.current.start(args)
    })

    const targetArgs = createLocalCsvMigrationTarget.mock.calls[0] as unknown[]
    const injectedClock = targetArgs[3] as {
      now: () => Date
    }
    expect(injectedClock.now()).toBeInstanceOf(Date)
  })
})
