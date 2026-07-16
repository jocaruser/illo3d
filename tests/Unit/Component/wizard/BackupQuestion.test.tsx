import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupQuestion } from '@/Component/wizard/BackupQuestion'
import { renderWithProviders } from '../helpers/renderWithProviders'

const yes = () => screen.getByTestId('wizard-backup-yes')
const no = () => screen.getByTestId('wizard-backup-no')

describe('BackupQuestion', () => {
  it('asks the question with both answers unselected', () => {
    renderWithProviders(<BackupQuestion value={null} onChange={vi.fn()} />)

    expect(
      screen.getByText('Would you like to back up your shop before migrating?')
    ).toBeInTheDocument()
    expect(yes()).toHaveAttribute('aria-pressed', 'false')
    expect(no()).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByTestId('wizard-backup-warning')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('wizard-backup-confirmed')
    ).not.toBeInTheDocument()
  })

  it('answers yes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BackupQuestion value={null} onChange={onChange} />)

    await user.click(yes())
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('answers no', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BackupQuestion value={null} onChange={onChange} />)

    await user.click(no())
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('deselects when the already-selected yes is clicked again', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BackupQuestion value onChange={onChange} />)

    await user.click(yes())
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('deselects when the already-selected no is clicked again', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BackupQuestion value={false} onChange={onChange} />)

    await user.click(no())
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('switches from no to yes without deselecting', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BackupQuestion value={false} onChange={onChange} />)

    await user.click(yes())
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('colours the chosen yes green and dims the other', () => {
    renderWithProviders(<BackupQuestion value onChange={vi.fn()} />)

    expect(yes()).toHaveClass('bg-green-600', 'text-white')
    expect(yes()).toHaveAttribute('aria-pressed', 'true')
    expect(no()).toHaveClass('opacity-60')
  })

  it('colours the chosen no amber and dims the other', () => {
    renderWithProviders(<BackupQuestion value={false} onChange={vi.fn()} />)

    expect(no()).toHaveClass('bg-amber-500')
    expect(no()).toHaveAttribute('aria-pressed', 'true')
    expect(yes()).toHaveClass('opacity-60')
  })

  it('confirms the backup when yes is chosen', () => {
    renderWithProviders(<BackupQuestion value onChange={vi.fn()} />)

    expect(screen.getByTestId('wizard-backup-confirmed')).toHaveTextContent(
      'Your shop will be backed up before migration'
    )
    expect(screen.getByTestId('wizard-backup-confirmed')).toHaveTextContent(
      'A backup will be created as a copy of your current data.'
    )
    expect(
      screen.queryByTestId('wizard-backup-warning')
    ).not.toBeInTheDocument()
  })

  it('warns in amber when no is chosen', () => {
    renderWithProviders(<BackupQuestion value={false} onChange={vi.fn()} />)

    const warning = screen.getByTestId('wizard-backup-warning')
    expect(warning).toHaveClass('bg-amber-50')
    expect(warning).toHaveAttribute('role', 'alert')
    expect(warning).toHaveTextContent('Backup skipped')
    expect(warning).toHaveTextContent(
      'We strongly recommend creating a manual backup'
    )
    expect(
      screen.queryByTestId('wizard-backup-confirmed')
    ).not.toBeInTheDocument()
  })

  it('locks both answers while disabled', () => {
    renderWithProviders(<BackupQuestion value onChange={vi.fn()} disabled />)

    expect(yes()).toBeDisabled()
    expect(no()).toBeDisabled()
  })
})
