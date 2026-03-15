import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OpenExistingStep } from './OpenExistingStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('OpenExistingStep', () => {
  it('renders fixture folder input (dev/CSV mode)', () => {
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
    expect(screen.getByText('wizard.fixtureFolderNameLabel')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('wizard.fixtureFolderNamePlaceholder')).toBeInTheDocument()
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

    const input = screen.getByPlaceholderText('wizard.fixtureFolderNamePlaceholder')
    fireEvent.change(input, { target: { value: 'happy-path' } })
    fireEvent.click(screen.getByText('wizard.openFolder'))

    await waitFor(() => {
      expect(onValidateFolder).toHaveBeenCalledWith('happy-path')
    })

    expect(onValidateFolder).toHaveBeenCalledWith('happy-path')
  })

  it('shows error when fixture folder name is empty', () => {
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

    expect(screen.getByText('wizard.fixtureFolderNameEmpty')).toBeInTheDocument()
    expect(onValidateFolder).not.toHaveBeenCalled()
  })
})
