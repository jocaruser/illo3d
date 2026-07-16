import { screen } from '@testing-library/react'
import { MigrationStepsGrid } from '@/Component/wizard/MigrationStepsGrid'
import { useMigrationStore } from '@/Store/migrationStore'
import { renderWithProviders } from '../helpers/renderWithProviders'

const { resolvePlanChain } = vi.hoisted(() => ({ resolvePlanChain: vi.fn() }))

vi.mock('@/Migration/registry', () => ({ resolvePlanChain }))

/** Mirrors the real v1→v3 chain closely enough to exercise every icon branch. */
const fullChain = [
  {
    fromMajor: 1,
    toMajor: 2,
    toVersion: '2.0.0',
    steps: [
      { id: 'clients' },
      { id: 'crm_notes' },
      { id: 'tags' },
      { id: 'tag_links' },
      { id: 'jobs' },
      { id: 'pieces' },
      { id: 'piece_items' },
      { id: 'inventory' },
      { id: 'lots' },
      { id: 'transactions' },
      { id: 'audit_log' },
    ],
  },
  {
    fromMajor: 2,
    toMajor: 3,
    toVersion: '3.0.0',
    steps: [{ id: 'jobs' }, { id: 'inventory' }],
  },
]

const card = (id: string) => screen.getByTestId(`wizard-migration-step-${id}`)

describe('MigrationStepsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolvePlanChain.mockReturnValue(fullChain)
    useMigrationStore.getState().reset()
  })

  describe('idle', () => {
    it('seeds one pending card per plan step, led by backup, deduped', () => {
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup={null} />
      )

      expect(screen.getByLabelText('Backup: pending')).toBeInTheDocument()
      expect(screen.getByLabelText('Clients: pending')).toBeInTheDocument()
      expect(screen.getByLabelText('Jobs: pending')).toBeInTheDocument()
      expect(screen.getByLabelText('Inventory: pending')).toBeInTheDocument()
      expect(screen.getByLabelText('Audit Log: pending')).toBeInTheDocument()
      // 'jobs' and 'inventory' appear in both plans but get one card each.
      expect(screen.getAllByTestId(/^wizard-migration-step-/)).toHaveLength(12)
    })

    it('labels every entity from the catalogue', () => {
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup={null} />
      )

      expect(card('crm_notes')).toHaveTextContent('Notes')
      expect(card('tag_links')).toHaveTextContent('Tag Links')
      expect(card('piece_items')).toHaveTextContent('Piece Items')
      expect(card('lots')).toHaveTextContent('Lots')
      expect(card('transactions')).toHaveTextContent('Transactions')
    })

    it('shows the backup card as done and skipped when the user declined', () => {
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup={false} />
      )

      expect(screen.getByLabelText('Backup: done')).toBeInTheDocument()
      expect(card('backup')).toHaveTextContent('Skipped')
      // Only the backup card is affected.
      expect(screen.getByLabelText('Clients: pending')).toBeInTheDocument()
    })

    it('leaves the backup card pending when the user asked for a backup', () => {
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup />
      )

      expect(screen.getByLabelText('Backup: pending')).toBeInTheDocument()
      expect(card('backup')).not.toHaveTextContent('Skipped')
    })

    it('falls back to the raw id for a step we ship no label for', () => {
      resolvePlanChain.mockReturnValue([
        {
          fromMajor: 2,
          toMajor: 3,
          toVersion: '3.0.0',
          steps: [{ id: 'future_sheet' }],
        },
      ])
      renderWithProviders(
        <MigrationStepsGrid shopVersion="2.0.0" keepOriginalAsBackup={null} />
      )

      expect(card('future_sheet')).toHaveTextContent('future_sheet')
      expect(screen.getByLabelText('future_sheet: pending')).toBeInTheDocument()
    })
  })

  describe('live', () => {
    it('renders each status from the store', () => {
      useMigrationStore.setState({
        phase: 'migrating',
        steps: [
          { id: 'backup', status: 'done' },
          { id: 'clients', status: 'running' },
          { id: 'jobs', status: 'pending' },
          { id: 'inventory', status: 'failed', error: 'header mismatch' },
        ],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup />
      )

      expect(screen.getByLabelText('Backup: done')).toBeInTheDocument()
      expect(screen.getByLabelText('Clients: running')).toBeInTheDocument()
      expect(screen.getByLabelText('Jobs: pending')).toBeInTheDocument()
      expect(screen.getByLabelText('Inventory: failed')).toBeInTheDocument()
    })

    it('styles running cards blue with a pulse, done green with a check', () => {
      useMigrationStore.setState({
        phase: 'migrating',
        steps: [
          { id: 'backup', status: 'done' },
          { id: 'clients', status: 'running' },
        ],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup />
      )

      expect(card('clients').firstElementChild).toHaveClass(
        'animate-pulse',
        'text-accent'
      )
      expect(card('backup').firstElementChild).toHaveClass('text-success')
      expect(
        card('backup').querySelector('[data-testid="step-check-icon"]')
      ).toBeInTheDocument()
    })

    it('styles pending grey and failed red, without a pulse', () => {
      useMigrationStore.setState({
        phase: 'migrating',
        steps: [
          { id: 'jobs', status: 'pending' },
          { id: 'inventory', status: 'failed' },
        ],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="1.0.0" keepOriginalAsBackup />
      )

      expect(card('jobs').firstElementChild).toHaveClass('text-text-muted')
      expect(card('jobs').firstElementChild).not.toHaveClass('animate-pulse')
      expect(card('inventory').firstElementChild).toHaveClass('text-danger')
    })

    it('translates the streamed description as the card detail', () => {
      useMigrationStore.setState({
        phase: 'migrating',
        steps: [
          {
            id: 'jobs',
            status: 'running',
            description: 'wizard.migrationStepJobsDueDate',
          },
        ],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="2.0.0" keepOriginalAsBackup />
      )

      expect(card('jobs')).toHaveTextContent(
        'Adding the due date column to jobs'
      )
    })

    it("shows a failed step's raw error as the card detail", () => {
      useMigrationStore.setState({
        phase: 'migrating',
        steps: [
          {
            id: 'jobs',
            status: 'failed',
            description: 'wizard.migrationStepJobsDueDate',
            error: "Sheet 'jobs': stored column 'x' does not match",
          },
        ],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="2.0.0" keepOriginalAsBackup />
      )

      // The error wins over the description — it is the actionable half.
      expect(card('jobs')).toHaveTextContent("stored column 'x' does not match")
      expect(card('jobs')).not.toHaveTextContent('Adding the due date column')
    })

    it('still pins the backup card to skipped mid-run when the user declined', () => {
      useMigrationStore.setState({
        phase: 'backing-up',
        steps: [
          { id: 'backup', status: 'running' },
          { id: 'jobs', status: 'pending' },
        ],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="2.0.0" keepOriginalAsBackup={false} />
      )

      expect(screen.getByLabelText('Backup: done')).toBeInTheDocument()
      expect(card('backup')).toHaveTextContent('Skipped')
    })

    it('renders no card without a detail line when a step reports neither', () => {
      useMigrationStore.setState({
        phase: 'migrating',
        steps: [{ id: 'jobs', status: 'pending' }],
      })
      renderWithProviders(
        <MigrationStepsGrid shopVersion="2.0.0" keepOriginalAsBackup />
      )

      expect(card('jobs').querySelector('p')).toBeNull()
    })
  })
})
