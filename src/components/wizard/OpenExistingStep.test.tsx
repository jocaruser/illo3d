import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OpenExistingStep } from './OpenExistingStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('OpenExistingStep', () => {
  it('renders Picker button and folder ID input', () => {
    const onSelectFolder = vi.fn()
    const onValidateFolder = vi.fn()

    render(
      <OpenExistingStep
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onSelectFolder={onSelectFolder}
        onValidateFolder={onValidateFolder}
      />
    )

    expect(screen.getAllByText('wizard.openExisting').length).toBeGreaterThan(0)
    expect(screen.getByText('wizard.folderIdLabel')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('wizard.folderIdPlaceholder')).toBeInTheDocument()
    expect(screen.getByText('wizard.openFolder')).toBeInTheDocument()
  })

  it('calls onValidateFolder when submitting folder ID', async () => {
    const onValidateFolder = vi.fn().mockResolvedValue({ ok: true })

    render(
      <OpenExistingStep
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onSelectFolder={vi.fn()}
        onValidateFolder={onValidateFolder}
      />
    )

    const input = screen.getByPlaceholderText('wizard.folderIdPlaceholder')
    fireEvent.change(input, { target: { value: 'folder-id-123' } })
    fireEvent.click(screen.getByText('wizard.openFolder'))

    await waitFor(() => {
      expect(onValidateFolder).toHaveBeenCalledWith('folder-id-123')
    })

    expect(onValidateFolder).toHaveBeenCalledWith('folder-id-123')
  })

  it('shows error when folder ID is empty', () => {
    const onValidateFolder = vi.fn()

    render(
      <OpenExistingStep
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onSelectFolder={vi.fn()}
        onValidateFolder={onValidateFolder}
      />
    )

    fireEvent.click(screen.getByText('wizard.openFolder'))

    expect(screen.getByText('wizard.folderIdEmpty')).toBeInTheDocument()
    expect(onValidateFolder).not.toHaveBeenCalled()
  })
})
