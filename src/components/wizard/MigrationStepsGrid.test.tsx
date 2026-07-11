import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MigrationStepsGrid } from './MigrationStepsGrid'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const strings: Record<string, string> = {
        'wizard.migrationSummary': '{{done}} of {{total}} done',
        'wizard.migrationAllDone': 'All done',
      }
      const template = strings[key] ?? key
      if (!opts) return template
      return template.replace(/\{\{(\w+)\}\}/g, (_, name) => opts[name] ?? `{{${name}}}`)
    },
  }),
}))

describe('MigrationStepsGrid', () => {
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
})
