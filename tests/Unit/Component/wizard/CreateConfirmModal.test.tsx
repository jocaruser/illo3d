import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateConfirmModal } from '@/Component/wizard/CreateConfirmModal'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('CreateConfirmModal', () => {
  it('names the folder and warns about overwriting it', () => {
    renderWithProviders(
      <CreateConfirmModal
        open
        folderName="my-shop"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Create new shop?')
    expect(
      screen.getByText(
        'Create a new illo3d shop in "my-shop"? Existing shop files will be overwritten.'
      )
    ).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    renderWithProviders(
      <CreateConfirmModal
        open={false}
        folderName="my-shop"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirms the creation', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <CreateConfirmModal
        open
        folderName="my-shop"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    await user.click(screen.getByTestId('wizard-create-confirm-action'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('cancels the creation', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <CreateConfirmModal
        open
        folderName="my-shop"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByTestId('wizard-create-confirm-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('locks both buttons and shows progress while creating', () => {
    renderWithProviders(
      <CreateConfirmModal
        open
        busy
        folderName="my-shop"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByTestId('wizard-create-confirm-action')).toBeDisabled()
    expect(
      screen.getByTestId('wizard-create-confirm-action')
    ).toHaveTextContent('Creating your shop…')
    expect(screen.getByTestId('wizard-create-confirm-cancel')).toBeDisabled()
  })

  it('surfaces a creation error', () => {
    renderWithProviders(
      <CreateConfirmModal
        open
        folderName="my-shop"
        error="Permission denied"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied')
  })

  it('shows no error slot for an empty error', () => {
    renderWithProviders(
      <CreateConfirmModal
        open
        folderName="my-shop"
        error=""
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
