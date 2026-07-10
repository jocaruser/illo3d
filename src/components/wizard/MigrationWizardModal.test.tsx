import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MigrationWizardModal } from './MigrationWizardModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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
})
