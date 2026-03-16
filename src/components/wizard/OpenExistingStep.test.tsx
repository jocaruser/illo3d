import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OpenExistingStep } from './OpenExistingStep'
import { getLocalCsvFixtureFolder } from '@/config/csvBackend'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/config/csvBackend', () => ({
  getLocalCsvFixtureFolder: vi.fn(() => 'happy-path'),
}))

const defaultProps = {
  backend: 'local-csv' as const,
  onBack: vi.fn(),
  onSuccess: vi.fn(),
  onSelectFolder: vi.fn(),
  onSelectLocalFolder: vi.fn(),
  onValidateFolder: vi.fn(),
}

describe('OpenExistingStep', () => {
  it('renders configured fixture button for local-csv when VITE_LOCAL_CSV_FIXTURE_FOLDER is set', () => {
    render(<OpenExistingStep {...defaultProps} />)

    expect(screen.getAllByText('wizard.openExisting').length).toBeGreaterThan(0)
    expect(screen.queryByPlaceholderText('wizard.fixtureFolderNamePlaceholder')).not.toBeInTheDocument()
  })

  it('calls onValidateFolder with configured folder when clicking Open existing', async () => {
    const onValidateFolder = vi.fn().mockResolvedValue({ ok: true })

    render(
      <OpenExistingStep
        {...defaultProps}
        backend="local-csv"
        onValidateFolder={onValidateFolder}
      />
    )

    const openButton = screen.getByRole('button', { name: 'wizard.openExisting' })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(onValidateFolder).toHaveBeenCalledWith('happy-path')
    })
  })

  it('renders directory picker button when getLocalCsvFixtureFolder returns null', () => {
    vi.mocked(getLocalCsvFixtureFolder).mockReturnValueOnce(null)
    render(<OpenExistingStep {...defaultProps} />)

    expect(screen.getAllByText('wizard.openExisting').length).toBeGreaterThan(0)
    expect(screen.queryByPlaceholderText('wizard.fixtureFolderNamePlaceholder')).not.toBeInTheDocument()
  })

  it('renders Picker button and folderIdLabel for google-drive', () => {
    render(
      <OpenExistingStep
        {...defaultProps}
        backend="google-drive"
      />
    )

    expect(screen.getByText('wizard.folderIdLabel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'wizard.openExisting' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('wizard.folderIdPlaceholder')).toBeInTheDocument()
  })
})
