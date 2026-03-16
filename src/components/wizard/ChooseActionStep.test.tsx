import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChooseActionStep } from './ChooseActionStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const defaultProps = {
  selectedBackend: null as 'local-csv' | 'google-drive' | null,
  onSelectBackend: vi.fn(),
  onCreateNew: vi.fn(),
  onOpenExisting: vi.fn(),
  onCancel: vi.fn(),
}

describe('ChooseActionStep', () => {
  it('renders storage options and action buttons', () => {
    render(<ChooseActionStep {...defaultProps} />)

    expect(screen.getByText('wizard.chooseStorage')).toBeInTheDocument()
    expect(screen.getByText('wizard.localCsv')).toBeInTheDocument()
    expect(screen.getByText('wizard.googleDrive')).toBeInTheDocument()
    expect(screen.getByText('wizard.createNew')).toBeInTheDocument()
    expect(screen.getByText('wizard.openExisting')).toBeInTheDocument()
    expect(screen.getByText('wizard.cancel')).toBeInTheDocument()
  })

  it('calls onSelectBackend when storage option is clicked', () => {
    const onSelectBackend = vi.fn()
    render(<ChooseActionStep {...defaultProps} onSelectBackend={onSelectBackend} />)

    fireEvent.click(screen.getByText('wizard.localCsv'))
    expect(onSelectBackend).toHaveBeenCalledWith('local-csv')

    fireEvent.click(screen.getByText('wizard.googleDrive'))
    expect(onSelectBackend).toHaveBeenCalledWith('google-drive')
  })

  it('calls onCreateNew when create button is clicked', () => {
    const onCreateNew = vi.fn()
    render(
      <ChooseActionStep
        {...defaultProps}
        selectedBackend="google-drive"
        onCreateNew={onCreateNew}
      />
    )

    fireEvent.click(screen.getByText('wizard.createNew'))
    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<ChooseActionStep {...defaultProps} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('wizard.cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables action buttons when no backend selected', () => {
    render(<ChooseActionStep {...defaultProps} selectedBackend={null} />)

    const createBtn = screen.getByText('wizard.createNew').closest('button')
    const openBtn = screen.getByText('wizard.openExisting').closest('button')
    expect(createBtn).toBeDisabled()
    expect(openBtn).toBeDisabled()
  })

  it('enables action buttons when backend selected', () => {
    render(<ChooseActionStep {...defaultProps} selectedBackend="local-csv" />)

    const createBtn = screen.getByText('wizard.createNew').closest('button')
    const openBtn = screen.getByText('wizard.openExisting').closest('button')
    expect(createBtn).not.toBeDisabled()
    expect(openBtn).not.toBeDisabled()
  })
})
