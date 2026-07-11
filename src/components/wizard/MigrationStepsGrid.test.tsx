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
  it('renders StepCard for every entity', () => {
    render(<MigrationStepsGrid />)
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

  it('shows summary with correct count', () => {
    const items = [
      { entityId: 'clients', label: 'Clients', status: 'done' as const },
      { entityId: 'jobs', label: 'Jobs', status: 'pending' as const },
    ]
    render(<MigrationStepsGrid items={items} />)
    expect(screen.getByText('1 of 2 done')).toBeInTheDocument()
  })

  it('shows all-done summary when every item is done', () => {
    const items = [
      { entityId: 'clients', label: 'Clients', status: 'done' as const },
      { entityId: 'jobs', label: 'Jobs', status: 'done' as const },
    ]
    render(<MigrationStepsGrid items={items} />)
    expect(screen.getByText('All done')).toBeInTheDocument()
  })

  it('defaults to pending status when items not provided', () => {
    render(<MigrationStepsGrid />)
    const clientsCard = screen.getByLabelText('Clients: pending')
    expect(clientsCard).toBeInTheDocument()
  })
})
