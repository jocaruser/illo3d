import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MigrationStepsGrid } from './MigrationStepsGrid'
import { useMigrationStore } from '@/stores/migrationStore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const strings: Record<string, string> = {
        'wizard.migrationSummary': '{{done}} of {{total}} done',
        'wizard.migrationAllDone': 'All done',
        'wizard.migrationBackupResolvedNo': 'Backup skipped',
        'wizard.migrationBackupSkipped': 'Skipped',
      }
      const template = strings[key] ?? key
      if (!opts) return template
      return template.replace(/\{\{(\w+)\}\}/g, (_, name) => opts[name] ?? `{{${name}}}`)
    },
  }),
}))

describe('MigrationStepsGrid', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('renders StepCard for every entity including backup', () => {
    render(<MigrationStepsGrid />)
    expect(screen.getByText('Backup')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toBeInTheDocument()
    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Audit Log')).toBeInTheDocument()
    expect(screen.getByText('CRM Notes')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Tag Links')).toBeInTheDocument()
    expect(screen.getByText('Pieces')).toBeInTheDocument()
    expect(screen.getByText('Piece Items')).toBeInTheDocument()
    expect(screen.getByText('Lots')).toBeInTheDocument()
  })

  it('shows initial pending status on each card', () => {
    render(<MigrationStepsGrid />)
    const backupCard = screen.getByLabelText('Backup: pending')
    expect(backupCard).toBeInTheDocument()
    const clientsCard = screen.getByLabelText('Clients: pending')
    expect(clientsCard).toBeInTheDocument()
  })

  it('shows summary with zero progress initially', () => {
    render(<MigrationStepsGrid />)
    expect(screen.getByText('0 of 12 done')).toBeInTheDocument()
  })

  it('marks backup as done with skipped detail when backupAnswer is false', () => {
    render(<MigrationStepsGrid backupAnswer={false} />)
    const backupCard = screen.getByLabelText('Backup: done')
    expect(backupCard).toBeInTheDocument()
    expect(screen.getByText('Skipped')).toBeInTheDocument()
  })

  it('shows 1 of 12 done when backup is skipped', () => {
    render(<MigrationStepsGrid backupAnswer={false} />)
    expect(screen.getByText('1 of 12 done')).toBeInTheDocument()
  })

  it('shows backup as pending when backupAnswer is true', () => {
    render(<MigrationStepsGrid backupAnswer={true} />)
    const backupCard = screen.getByLabelText('Backup: pending')
    expect(backupCard).toBeInTheDocument()
  })

  it('renders store-driven steps once a migration run starts', () => {
    useMigrationStore.getState().seedSteps([
      { id: 'backup', status: 'done', description: 'wizard.migrationStepBackupDone' },
      { id: 'clients', status: 'running', description: 'wizard.migrationStepAddingColumns' },
      { id: 'jobs', status: 'pending' },
    ])
    useMigrationStore.getState().setPhase('migrating')

    render(<MigrationStepsGrid backupAnswer={true} />)

    expect(screen.getByLabelText('Backup: done')).toBeInTheDocument()
    expect(screen.getByLabelText('Clients: running')).toBeInTheDocument()
    expect(screen.getByLabelText('Jobs: pending')).toBeInTheDocument()
    expect(
      screen.getByText('wizard.migrationStepAddingColumns')
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
  })

  it('updates the running card description in place', () => {
    useMigrationStore.getState().seedSteps([
      { id: 'clients', status: 'running', description: 'wizard.migrationStepCheckingColumns' },
    ])
    useMigrationStore.getState().setPhase('migrating')
    render(<MigrationStepsGrid />)
    expect(
      screen.getByText('wizard.migrationStepCheckingColumns')
    ).toBeInTheDocument()

    act(() => {
      useMigrationStore.getState().updateStep('clients', {
        description: 'wizard.migrationStepAddingColumns',
      })
    })

    expect(
      screen.getByText('wizard.migrationStepAddingColumns')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Clients: running')).toBeInTheDocument()
  })

  it('shows a failed card with its error message', () => {
    useMigrationStore.getState().seedSteps([
      { id: 'clients', status: 'failed', error: 'columns exploded' },
      { id: 'jobs', status: 'pending' },
    ])
    useMigrationStore.getState().setPhase('failed')

    render(<MigrationStepsGrid />)

    expect(screen.getByLabelText('Clients: failed')).toBeInTheDocument()
    expect(screen.getByText('columns exploded')).toBeInTheDocument()
    expect(screen.getByLabelText('Jobs: pending')).toBeInTheDocument()
  })

  it('shows the all-done summary when every step is done', () => {
    useMigrationStore.getState().seedSteps([
      { id: 'backup', status: 'done' },
      { id: 'clients', status: 'done' },
    ])
    useMigrationStore.getState().setPhase('done')

    render(<MigrationStepsGrid />)

    expect(screen.getByText('All done')).toBeInTheDocument()
  })
})
