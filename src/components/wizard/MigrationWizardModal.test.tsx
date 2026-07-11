import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MigrationWizardModal } from './MigrationWizardModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/i18n', () => ({
  default: { changeLanguage: vi.fn() },
}))

vi.mock('@/stores/userPreferencesStore', () => ({
  useUserPreferencesStore: vi.fn((selector) =>
    selector({
      language: 'en',
      setLanguage: vi.fn(),
    }),
  ),
}))

describe('MigrationWizardModal', () => {
  it('renders the title', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    expect(screen.getByText('wizard.migrationTitle')).toBeInTheDocument()
  })

  it('shows shop version, app version, and labels', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
    expect(screen.getByText('2.0.0')).toBeInTheDocument()
    expect(screen.getByText('wizard.migrationShopLabel')).toBeInTheDocument()
    expect(screen.getByText('wizard.migrationAppLabel')).toBeInTheDocument()
  })

  it('has a disabled Continue button', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    const continueButton = screen.getByTestId('wizard-migration-continue')
    expect(continueButton).toBeDisabled()
  })

  it('fires onLogOut when Log out is clicked', () => {
    const onLogOut = vi.fn()
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={onLogOut}
      />,
    )
    fireEvent.click(screen.getByTestId('wizard-migration-logout'))
    expect(onLogOut).toHaveBeenCalledTimes(1)
  })

  it('renders StepGrid with all 11 entity cards', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
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
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
        items={items}
      />,
    )
    expect(screen.getByText('wizard.migrationSummary')).toBeInTheDocument()
  })

  it('shows all-done summary when every item is done', () => {
    const items = [
      { entityId: 'clients', label: 'Clients', status: 'done' as const },
      { entityId: 'jobs', label: 'Jobs', status: 'done' as const },
    ]
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
        items={items}
      />,
    )
    expect(screen.getByText('wizard.migrationAllDone')).toBeInTheDocument()
  })

  it('defaults to pending status when items not provided', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    const clientsCard = screen.getByLabelText('Clients: pending')
    expect(clientsCard).toBeInTheDocument()
  })
})
