import { act, renderHook } from '@testing-library/react'
import {
  BACKUP_SKIPPED_KEY,
  migrationHopMajors,
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
vi.mock('@/Migration/orchestrator', async (importOriginal) => ({
  // The orchestrator's constants are re-exported through this hook; only the
  // run itself is faked.
  ...(await importOriginal<typeof import('@/Migration/orchestrator')>()),
  runPlans,
}))
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

function makeSession() {
  return {
    ctx: {},
    writeBackup: vi.fn(async () => {}),
    persist: vi.fn(async () => {}),
  }
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

describe('migrationHopMajors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolvePlanChain.mockReturnValue(v1Chain)
  })

  it('lists each hop of the resolved chain in run order', () => {
    expect(migrationHopMajors('1.0.0')).toEqual([1, 2])
  })

  it('explains nothing when the chain cannot be resolved', () => {
    resolvePlanChain.mockImplementation(() => {
      throw new Error('No migration plan found from v9')
    })
    expect(migrationHopMajors('9.0.0')).toEqual([])
  })

  it('explains nothing for an unparseable version', () => {
    expect(migrationHopMajors('not-a-version')).toEqual([])
  })
})

describe('useMigration', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    resolvePlanChain.mockReturnValue(v1Chain)
    runPlans.mockImplementation(async () => ({
      ok: true,
      session: makeSession(),
    }))
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

  it('builds a local target and runs the plans without touching the shop', async () => {
    const { result } = renderHook(() => useMigration(clock))

    let outcome: Awaited<ReturnType<typeof result.current.start>> | undefined
    await act(async () => {
      outcome = await result.current.start(args)
    })

    expect(createLocalCsvMigrationTarget).toHaveBeenCalledWith(
      handle,
      '2.0.0',
      '3.0.0',
      clock
    )
    expect(runPlans).toHaveBeenCalledWith(
      v1Chain,
      { kind: 'local-target' },
      { keepOriginalAsBackup: true }
    )
    expect(outcome).toEqual({ ok: true })
    // Nothing persisted, validated or entered until confirm.
    expect(validateShopFolder).not.toHaveBeenCalled()
    expect(hydrate).not.toHaveBeenCalled()
    expect(useShopStore.getState().activeShop).toBeNull()
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
      '3.0.0',
      clock
    )
    expect(runPlans).toHaveBeenCalledWith(
      v1Chain,
      { kind: 'gsheet-target' },
      { keepOriginalAsBackup: true }
    )
  })

  it('seeds the grid before running, marking backup skipped when declined', async () => {
    // Freeze the store the moment runPlans is entered, before it re-seeds.
    let seeded: unknown
    runPlans.mockImplementation(async () => {
      seeded = useMigrationStore.getState().steps
      return { ok: true, session: makeSession() }
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
      return { ok: true, session: makeSession() }
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

  it('returns the orchestrator failure untouched', async () => {
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

  describe('confirm', () => {
    async function startRun(hook: {
      result: { current: ReturnType<typeof useMigration> }
    }) {
      await act(async () => {
        await hook.result.current.start(args)
      })
    }

    it('refuses to confirm before a run has completed', async () => {
      const hook = renderHook(() => useMigration(clock))

      let outcome:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        outcome = await hook.result.current.confirm('F1')
      })

      expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
      expect(hook.result.current.failureMessage).toBe(
        'No completed migration run to confirm'
      )
    })

    it('persists, re-validates and enters the shop in that order', async () => {
      const order: string[] = []
      const session = makeSession()
      session.persist.mockImplementation(async () => {
        order.push(`persist:${useMigrationStore.getState().phase}`)
      })
      runPlans.mockResolvedValue({ ok: true, session })
      validateShopFolder.mockImplementation(async () => {
        order.push('validate')
        return { ok: true, shop, metadata: {} }
      })
      hydrate.mockImplementation(async () => {
        order.push('hydrate')
      })
      const hook = renderHook(() => useMigration(clock))
      await startRun(hook)

      let outcome:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        outcome = await hook.result.current.confirm('F1')
      })

      expect(order).toEqual(['persist:committing', 'validate', 'hydrate'])
      expect(validateShopFolder).toHaveBeenCalledWith('F1')
      expect(useShopStore.getState().activeShop).toEqual(shop)
      expect(useMigrationStore.getState().phase).toBe('done')
      expect(outcome).toEqual({ ok: true })
    })

    it('confirms only once — the session is spent on success', async () => {
      const hook = renderHook(() => useMigration(clock))
      await startRun(hook)

      await act(async () => {
        await hook.result.current.confirm('F1')
      })
      let second:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        second = await hook.result.current.confirm('F1')
      })

      expect(second).toEqual({ ok: false, failedAt: 'commit' })
    })

    it('fails at commit when persisting throws, leaving the shop closed', async () => {
      const session = makeSession()
      session.persist.mockRejectedValue(new Error('folder unwritable'))
      runPlans.mockResolvedValue({ ok: true, session })
      const hook = renderHook(() => useMigration(clock))
      await startRun(hook)

      let outcome:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        outcome = await hook.result.current.confirm('F1')
      })

      expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
      expect(hook.result.current.phase).toBe('failed')
      expect(hook.result.current.failureMessage).toBe('folder unwritable')
      expect(validateShopFolder).not.toHaveBeenCalled()
      expect(useShopStore.getState().activeShop).toBeNull()
    })

    it('fails when the migrated shop does not re-validate', async () => {
      validateShopFolder.mockResolvedValue({
        ok: false,
        error: 'structure',
        detail: 'bad',
      })
      const hook = renderHook(() => useMigration(clock))
      await startRun(hook)

      let outcome:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        outcome = await hook.result.current.confirm('F1')
      })

      expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
      expect(hook.result.current.failureMessage).toBe(
        'Migrated shop failed validation (structure)'
      )
      expect(useShopStore.getState().activeShop).toBeNull()
    })

    it('fails when hydrating the migrated shop throws', async () => {
      hydrate.mockRejectedValue(new Error('sheet unreachable'))
      const hook = renderHook(() => useMigration(clock))
      await startRun(hook)

      let outcome:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        outcome = await hook.result.current.confirm('F1')
      })

      expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
      expect(hook.result.current.failureMessage).toBe('sheet unreachable')
      expect(useShopStore.getState().activeShop).toBeNull()
    })

    it('drops any previous session when a new run starts', async () => {
      runPlans.mockResolvedValueOnce({ ok: true, session: makeSession() })
      const hook = renderHook(() => useMigration(clock))
      await startRun(hook)

      // The retry fails before producing a session…
      runPlans.mockResolvedValueOnce({ ok: false, failedAt: 'jobs' })
      await startRun(hook)

      // …so the stale session from the first run must not be confirmable.
      let outcome:
        | Awaited<ReturnType<typeof hook.result.current.confirm>>
        | undefined
      await act(async () => {
        outcome = await hook.result.current.confirm('F1')
      })
      expect(outcome).toEqual({ ok: false, failedAt: 'commit' })
      expect(hook.result.current.failureMessage).toBe(
        'No completed migration run to confirm'
      )
    })
  })
})
