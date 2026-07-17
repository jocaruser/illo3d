import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('ConfirmDialog', () => {
  it('renders title, message, and translated default buttons', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Archive client"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Archive client')
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
  })

  it('supports custom button labels and optional children', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Delete"
        message="Gone forever."
        confirmLabel="Delete it"
        cancelLabel="Keep it"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      >
        <label>
          Extra option <input type="checkbox" />
        </label>
      </ConfirmDialog>
    )

    expect(screen.getByRole('button', { name: 'Delete it' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeInTheDocument()
    expect(screen.getByLabelText('Extra option')).toBeInTheDocument()
  })

  it('invokes callbacks from the buttons', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <ConfirmDialog open title="T" message="M" onConfirm={onConfirm} onCancel={onCancel} />
    )

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons and shows busy text while busy', () => {
    renderWithProviders(
      <ConfirmDialog open busy title="T" message="M" onConfirm={vi.fn()} onCancel={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('shows the error slot when an error is set', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="T"
        message="M"
        error="Could not delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Could not delete')
  })

  it('hides the error slot for an empty error', () => {
    renderWithProviders(
      <ConfirmDialog open title="T" message="M" error="" onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    renderWithProviders(
      <ConfirmDialog open={false} title="T" message="M" onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
