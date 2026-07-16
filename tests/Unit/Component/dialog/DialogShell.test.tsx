import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogShell } from '@/Component/dialog/DialogShell'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('DialogShell', () => {
  it('renders nothing when closed', () => {
    renderWithProviders(
      <DialogShell open={false} onClose={vi.fn()}>
        <p>Body</p>
      </DialogShell>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a modal dialog into a portal and focuses the panel', () => {
    renderWithProviders(
      <DialogShell open onClose={vi.fn()} labelledBy="dialog-title">
        <h2 id="dialog-title">Title</h2>
      </DialogShell>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
    expect(dialog).toHaveClass('dialog-panel-enter')
    expect(dialog).toHaveFocus()
    expect(document.querySelector('.dialog-overlay-enter')).toHaveClass('bg-black/40')
  })

  it('closes on Escape but not on other keys', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <DialogShell open onClose={onClose}>
        <p>Body</p>
      </DialogShell>
    )

    await user.keyboard('a')
    expect(onClose).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on overlay click but not on panel click', () => {
    const onClose = vi.fn()
    renderWithProviders(
      <DialogShell open onClose={onClose}>
        <p>Body</p>
      </DialogShell>
    )

    fireEvent.click(screen.getByText('Body'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('.dialog-overlay-enter') as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stops listening for Escape after unmount', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(
      <DialogShell open onClose={onClose}>
        <p>Body</p>
      </DialogShell>
    )

    unmount()
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })
})
