import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

  it('renders the backup question and buttons', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    expect(screen.getByText('wizard.migrationBackupQuestion')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-backup-yes')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-backup-no')).toBeInTheDocument()
  })

  it('shows backup banner with blueish primary background', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    const questionText = screen.getByText('wizard.migrationBackupQuestion')
    const banner = questionText.closest('[class*="bg-primary"]')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveClass('bg-primary/5')
    expect(banner).toHaveClass('border-primary/20')
  })

  it('shows warning when No is selected', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    expect(screen.queryByText('wizard.migrationBackupWarning')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('wizard-backup-no'))
    expect(screen.getByText('wizard.migrationBackupWarning')).toBeInTheDocument()
  })

  it('shows warning box with yellow/amber classes when No is selected', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId('wizard-backup-no'))
    const warningBox = screen.getByTestId('wizard-backup-warning')
    expect(warningBox).toBeInTheDocument()
    expect(warningBox).toHaveClass('bg-amber-50')
    expect(warningBox).toHaveClass('border-amber-200')
    expect(warningBox).toHaveClass('text-amber-900')
    expect(screen.getByText('wizard.migrationBackupWarning')).toBeInTheDocument()
  })

  it('hides warning when switching from No to Yes', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId('wizard-backup-no'))
    expect(screen.getByText('wizard.migrationBackupWarning')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('wizard-backup-yes'))
    expect(screen.queryByText('wizard.migrationBackupWarning')).not.toBeInTheDocument()
  })

  it('has Continue disabled initially', () => {
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

  it('keeps Continue disabled until cooldown elapses after answering', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    const continueButton = screen.getByTestId('wizard-migration-continue')
    fireEvent.click(screen.getByTestId('wizard-backup-yes'))
    expect(continueButton).toBeDisabled()
    act(() => { vi.advanceTimersByTime(6000) })
    expect(continueButton).not.toBeDisabled()
  })

  it('resets cooldown when answer changes', () => {
    render(
      <MigrationWizardModal
        shopVersion="1.0.0"
        appVersion="2.0.0"
        onLogOut={vi.fn()}
      />,
    )
    const continueButton = screen.getByTestId('wizard-migration-continue')
    fireEvent.click(screen.getByTestId('wizard-backup-yes'))
    act(() => { vi.advanceTimersByTime(6000) })
    expect(continueButton).not.toBeDisabled()
    fireEvent.click(screen.getByTestId('wizard-backup-no'))
    expect(continueButton).toBeDisabled()
    act(() => { vi.advanceTimersByTime(6000) })
    expect(continueButton).not.toBeDisabled()
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
