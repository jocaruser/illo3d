import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { COOLDOWN_MS } from '@/Component/wizard/CooldownContinueButton'
import { MigrationWizardModal } from '@/Component/wizard/MigrationWizardModal'
import { useBackendStore } from '@/Store/backendStore'
import { useMigrationStore } from '@/Store/migrationStore'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { renderWithProviders } from '../helpers/renderWithProviders'

const {
  resolvePlanChain,
  runPlans,
  createLocalCsvMigrationTarget,
  validateShopFolder,
  hydrate,
} = vi.hoisted(() => ({
  resolvePlanChain: vi.fn(),
  runPlans: vi.fn(),
  createLocalCsvMigrationTarget: vi.fn(() => ({ kind: 'local-target' })),
  validateShopFolder: vi.fn(),
  hydrate: vi.fn(),
}))

vi.mock('@/Migration/registry', () => ({ resolvePlanChain }))
vi.mock('@/Migration/orchestrator', () => ({ runPlans }))
vi.mock('@/Migration/Target/LocalCsvMigrationTarget', () => ({
  createLocalCsvMigrationTarget,
}))
vi.mock('@/Migration/Target/GSheetMigrationTarget', () => ({
  createGSheetMigrationTarget: vi.fn(),
}))
vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(() => ({ readMetadata: vi.fn() })),
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

const chain = [
  {
    fromMajor: 2,
    toMajor: 3,
    toVersion: '3.0.0',
    steps: [{ id: 'jobs' }, { id: 'inventory' }],
  },
]

const candidate = { folderId: 'F1', shopVersion: '2.0.0', appVersion: '3.0.0' }

const shop = {
  folderId: 'F1',
  folderName: 'illo3d',
  spreadsheetId: 'SS-NEW',
  metadataVersion: '3.0.0',
}

const handle = { name: 'my-shop' } as unknown as FileSystemDirectoryHandle

const continueButton = () => screen.getByTestId('wizard-migration-continue')

function renderModal(onLogOut = vi.fn()) {
  return {
    onLogOut,
    ...renderWithProviders(
      <MigrationWizardModal candidate={candidate} onLogOut={onLogOut} />
    ),
  }
}

/** Answer the backup question and wait out the deliberate cooldown. */
async function answerAndCoolDown(
  user: ReturnType<typeof userEvent.setup>,
  answer: 'yes' | 'no'
) {
  await user.click(screen.getByTestId(`wizard-backup-${answer}`))
  act(() => {
    vi.advanceTimersByTime(COOLDOWN_MS)
  })
  await waitFor(() => expect(continueButton()).toBeEnabled())
}

describe('MigrationWizardModal', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    // `shouldAdvanceTime` keeps user-event's own internal waits resolving while
    // the cooldown clock stays under the test's control.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    resolvePlanChain.mockReturnValue(chain)
    runPlans.mockResolvedValue({
      ok: true,
      session: { submit: vi.fn().mockResolvedValue(undefined) },
    })
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
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('is a modal dialog titled as the migration wizard', () => {
    renderModal()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Migration Wizard')
  })

  it('compares the shop version against the app version', () => {
    renderModal()

    expect(screen.getByText('Current version')).toBeInTheDocument()
    expect(screen.getByText('2.0.0')).toBeInTheDocument()
    expect(screen.getByText('Target version')).toBeInTheDocument()
    expect(screen.getByText('3.0.0')).toBeInTheDocument()
  })

  it('explains v2→v3 benefits only and promises no data loss', () => {
    renderModal()

    expect(screen.getByTestId('migration-hop-v2ToV3')).toBeInTheDocument()
    expect(screen.queryByTestId('migration-hop-v1ToV2')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Version 3 adds optional due dates on jobs/)
    ).toBeInTheDocument()
    expect(screen.getByText('Due dates on jobs')).toBeInTheDocument()
    expect(screen.getByText('Colours on materials')).toBeInTheDocument()
    expect(screen.queryByText('Audit logging')).not.toBeInTheDocument()
    expect(
      screen.getByText(/No data is removed or altered/)
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('explains v1→v2 benefits only for a shop on major 1', () => {
    resolvePlanChain.mockReturnValue([
      {
        fromMajor: 1,
        toMajor: 2,
        toVersion: '2.0.0',
        steps: [{ id: 'clients' }],
      },
    ])
    renderWithProviders(
      <MigrationWizardModal
        candidate={{
          folderId: 'F1',
          shopVersion: '1.0.0',
          appVersion: '2.0.0',
        }}
        onLogOut={vi.fn()}
      />
    )

    expect(screen.getByTestId('migration-hop-v1ToV2')).toBeInTheDocument()
    expect(screen.queryByTestId('migration-hop-v2ToV3')).not.toBeInTheDocument()
    expect(screen.getByText('Audit logging')).toBeInTheDocument()
    expect(screen.queryByText('Due dates on jobs')).not.toBeInTheDocument()
  })

  it('explains every hop in order for a multi-hop shop', () => {
    resolvePlanChain.mockReturnValue([
      {
        fromMajor: 1,
        toMajor: 2,
        toVersion: '2.0.0',
        steps: [{ id: 'clients' }],
      },
      {
        fromMajor: 2,
        toMajor: 3,
        toVersion: '3.0.0',
        steps: [{ id: 'jobs' }],
      },
    ])
    renderWithProviders(
      <MigrationWizardModal
        candidate={{
          folderId: 'F1',
          shopVersion: '1.0.0',
          appVersion: '3.0.0',
        }}
        onLogOut={vi.fn()}
      />
    )

    const sections = screen.getAllByTestId(/^migration-hop-/)
    expect(sections.map((el) => el.getAttribute('data-testid'))).toEqual([
      'migration-hop-v1ToV2',
      'migration-hop-v2ToV3',
    ])
    expect(screen.getByText('Audit logging')).toBeInTheDocument()
    expect(screen.getByText('Due dates on jobs')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('summarises progress against the idle grid', () => {
    renderModal()

    expect(screen.getByTestId('wizard-migration-summary')).toHaveTextContent(
      '0 of 3 done'
    )
  })

  it('counts the skipped backup toward the summary', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await user.click(screen.getByTestId('wizard-backup-no'))

    expect(screen.getByTestId('wizard-migration-summary')).toHaveTextContent(
      '1 of 3 done'
    )
  })

  it('says all done when every row has finished', () => {
    useMigrationStore.setState({
      phase: 'done',
      steps: [
        { id: 'backup', status: 'done' },
        { id: 'jobs', status: 'done' },
      ],
    })
    renderModal()

    expect(screen.getByTestId('wizard-migration-summary')).toHaveTextContent(
      'All done'
    )
  })

  it('renders the step grid', () => {
    renderModal()

    expect(screen.getByLabelText('Backup: pending')).toBeInTheDocument()
    expect(screen.getByLabelText('Jobs: pending')).toBeInTheDocument()
    expect(screen.getByLabelText('Inventory: pending')).toBeInTheDocument()
  })

  it('offers the same language and theme toggles as the welcome screen', () => {
    renderModal()

    expect(screen.getByTestId('language-toggle-es')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle-dark')).toBeInTheDocument()
  })

  it('gates Continue on the backup question', () => {
    renderModal()

    expect(continueButton()).toBeDisabled()
    expect(screen.queryByTestId('wizard-cooldown-ring')).not.toBeInTheDocument()
  })

  it('gates Continue on the cooldown after an answer, then unlocks it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await user.click(screen.getByTestId('wizard-backup-yes'))
    expect(continueButton()).toBeDisabled()
    expect(screen.getByTestId('wizard-cooldown-ring')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(COOLDOWN_MS)
    })
    await waitFor(() => expect(continueButton()).toBeEnabled())
    expect(screen.getByTestId('wizard-cooldown-check')).toBeInTheDocument()
  })

  it('restarts the cooldown when the answer changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')

    await user.click(screen.getByTestId('wizard-backup-no'))
    expect(continueButton()).toBeDisabled()
    expect(screen.getByTestId('wizard-cooldown-ring')).toBeInTheDocument()
  })

  it('re-locks Continue when the answer is deselected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')

    await user.click(screen.getByTestId('wizard-backup-yes'))
    expect(continueButton()).toBeDisabled()
    expect(screen.queryByTestId('wizard-cooldown-ring')).not.toBeInTheDocument()
  })

  it('runs the migration with the chosen backup answer then confirm enters the shop', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')
    await user.click(continueButton())

    await waitFor(() => expect(runPlans).toHaveBeenCalled())
    expect(runPlans).toHaveBeenCalledWith(
      chain,
      { kind: 'local-target' },
      {
        keepOriginalAsBackup: true,
      }
    )
    act(() => {
      useMigrationStore.getState().setPhase('awaiting-submit')
    })
    await user.click(screen.getByTestId('wizard-migration-confirm'))
    await waitFor(() =>
      expect(useShopStore.getState().activeShop).toEqual(shop)
    )
  })

  it('passes a declined backup through to the orchestrator', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'no')
    await user.click(continueButton())

    await waitFor(() =>
      expect(runPlans).toHaveBeenCalledWith(
        chain,
        { kind: 'local-target' },
        {
          keepOriginalAsBackup: false,
        }
      )
    )
  })

  it('locks the backup answers while the migration runs but not while awaiting submit', async () => {
    let release: ((value: { ok: true; session: { submit: () => Promise<void> } }) => void) | undefined
    runPlans.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve
        })
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')
    await user.click(continueButton())

    await waitFor(() =>
      expect(screen.getByTestId('wizard-backup-yes')).toBeDisabled()
    )
    expect(screen.getByTestId('wizard-backup-no')).toBeDisabled()
    expect(screen.getByTestId('wizard-migration-logout')).toBeDisabled()
    expect(continueButton()).toBeDisabled()

    await act(async () => {
      release?.({
        ok: true,
        session: { submit: vi.fn().mockResolvedValue(undefined) },
      })
    })
    act(() => {
      useMigrationStore.getState().setPhase('awaiting-submit')
    })
    await waitFor(() =>
      expect(screen.getByTestId('wizard-migration-logout')).toBeEnabled()
    )
  })

  it('shows the failure alert with the orchestrator message', async () => {
    runPlans.mockImplementation(async () => {
      useMigrationStore
        .getState()
        .setFailureMessage("Sheet 'jobs': stored column mismatch")
      useMigrationStore.getState().setPhase('failed')
      return { ok: false, failedAt: 'jobs' }
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')
    await user.click(continueButton())

    const alert = await screen.findByTestId('wizard-migration-failed')
    expect(alert).toHaveTextContent('Migration failed')
    expect(alert).toHaveTextContent("Sheet 'jobs': stored column mismatch")
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('shows the failure alert without a message when none was recorded', async () => {
    runPlans.mockImplementation(async () => {
      useMigrationStore.getState().setPhase('failed')
      return { ok: false, failedAt: 'jobs' }
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')
    await user.click(continueButton())

    const alert = await screen.findByTestId('wizard-migration-failed')
    expect(alert).toHaveTextContent('Migration failed')
  })

  it('re-enables Continue after a failure so the run can be retried', async () => {
    runPlans.mockImplementation(async () => {
      useMigrationStore.getState().setPhase('failed')
      return { ok: false, failedAt: 'jobs' }
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModal()

    await answerAndCoolDown(user, 'yes')
    await user.click(continueButton())
    await screen.findByTestId('wizard-migration-failed')

    await waitFor(() => expect(continueButton()).toBeEnabled())
    await user.click(continueButton())
    expect(runPlans).toHaveBeenCalledTimes(2)
  })

  it('hides the failure alert until something fails', () => {
    renderModal()

    expect(
      screen.queryByTestId('wizard-migration-failed')
    ).not.toBeInTheDocument()
  })

  it('logs out from the modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onLogOut } = renderModal()

    await user.click(screen.getByTestId('wizard-migration-logout'))
    expect(onLogOut).toHaveBeenCalledTimes(1)
  })

  it('stacks the actions with Continue above Log out on mobile', () => {
    renderModal()

    const actions = continueButton().parentElement
    expect(actions).toHaveClass(
      'flex-col-reverse',
      'sm:flex-row',
      'sm:justify-end'
    )
  })
})
