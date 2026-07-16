import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleDriveStep } from '@/Component/wizard/GoogleDriveStep'
import type { AuthUser } from '@/Store/authStore'
import { renderWithProviders } from '../helpers/renderWithProviders'

const user: AuthUser = {
  email: 'carlos@example.com',
  name: 'Carlos Ruiz',
  picture: 'https://example.test/avatar.png',
}

function renderStep(
  overrides: Partial<Parameters<typeof GoogleDriveStep>[0]> = {}
) {
  return renderWithProviders(
    <GoogleDriveStep
      user={user}
      onCreate={vi.fn()}
      onOpen={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />
  )
}

describe('GoogleDriveStep', () => {
  it('shows who is signed in, with their avatar', () => {
    renderStep()

    expect(
      screen.getByRole('heading', { name: 'Connect your shop' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('wizard-google-user')).toHaveTextContent(
      'Carlos Ruiz'
    )
    expect(screen.getByTestId('wizard-google-user')).toHaveTextContent(
      'carlos@example.com'
    )
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      'https://example.test/avatar.png'
    )
  })

  it('falls back to a generic avatar when Google returns no picture', () => {
    renderStep({ user: { email: 'a@b.c', name: 'No Picture' } })

    expect(screen.getByTestId('wizard-google-user')).toHaveTextContent(
      'No Picture'
    )
    expect(
      screen.queryByRole('presentation', { hidden: true })
    ).not.toBeInTheDocument()
  })

  it('omits the identity block entirely when there is no user', () => {
    renderStep({ user: null })

    expect(screen.queryByTestId('wizard-google-user')).not.toBeInTheDocument()
  })

  it('creates a new shop', async () => {
    const onCreate = vi.fn()
    const client = userEvent.setup()
    renderStep({ onCreate })

    await client.click(screen.getByTestId('wizard-google-create'))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('disables folder browsing and explains why', () => {
    renderStep()

    const picker = screen.getByTestId('wizard-google-open-picker')
    expect(picker).toBeDisabled()
    expect(picker).toHaveAttribute(
      'title',
      expect.stringContaining('coming soon')
    )
    expect(
      screen.getByText(/Folder browsing is coming soon/)
    ).toBeInTheDocument()
  })

  it('warns that the app only sees folders the user opens here', () => {
    renderStep()

    expect(
      screen.getByText(/only sees Google Drive files and folders you open here/)
    ).toBeInTheDocument()
  })

  it('opens a shop by pasted folder id', async () => {
    const onOpen = vi.fn()
    const client = userEvent.setup()
    renderStep({ onOpen })

    await client.type(screen.getByTestId('wizard-folder-id'), 'FOLDER-123')
    await client.click(screen.getByTestId('wizard-google-open-by-id'))

    expect(onOpen).toHaveBeenCalledWith('FOLDER-123')
  })

  it('trims the pasted folder id', async () => {
    const onOpen = vi.fn()
    const client = userEvent.setup()
    renderStep({ onOpen })

    await client.type(screen.getByTestId('wizard-folder-id'), '  FOLDER-123  ')
    await client.click(screen.getByTestId('wizard-google-open-by-id'))

    expect(onOpen).toHaveBeenCalledWith('FOLDER-123')
  })

  it('validates an empty folder id instead of opening', async () => {
    const onOpen = vi.fn()
    const client = userEvent.setup()
    renderStep({ onOpen })

    await client.click(screen.getByTestId('wizard-google-open-by-id'))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a folder ID'
    )
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('validates a whitespace-only folder id', async () => {
    const onOpen = vi.fn()
    const client = userEvent.setup()
    renderStep({ onOpen })

    await client.type(screen.getByTestId('wizard-folder-id'), '   ')
    await client.click(screen.getByTestId('wizard-google-open-by-id'))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a folder ID'
    )
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('clears the validation error once a real id is submitted', async () => {
    const client = userEvent.setup()
    renderStep()

    await client.click(screen.getByTestId('wizard-google-open-by-id'))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await client.type(screen.getByTestId('wizard-folder-id'), 'FOLDER-123')
    await client.click(screen.getByTestId('wizard-google-open-by-id'))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cancels back out of the Drive screen', async () => {
    const onCancel = vi.fn()
    const client = userEvent.setup()
    renderStep({ onCancel })

    await client.click(screen.getByTestId('wizard-google-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('locks every control and shows progress labels while busy', () => {
    renderStep({ busy: true })

    expect(screen.getByTestId('wizard-google-create')).toBeDisabled()
    expect(screen.getByTestId('wizard-google-create')).toHaveTextContent(
      'Creating your shop…'
    )
    expect(screen.getByTestId('wizard-folder-id')).toBeDisabled()
    expect(screen.getByTestId('wizard-google-open-by-id')).toBeDisabled()
    expect(screen.getByTestId('wizard-google-open-by-id')).toHaveTextContent(
      'Opening…'
    )
    expect(screen.getByTestId('wizard-google-cancel')).toBeDisabled()
  })
})
