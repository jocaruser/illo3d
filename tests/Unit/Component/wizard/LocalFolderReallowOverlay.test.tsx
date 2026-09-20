import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocalFolderReallowOverlay } from '@/Component/wizard/LocalFolderReallowOverlay'
import { initI18n } from '@/I18n'
import { I18nextProvider } from 'react-i18next'

function renderOverlay(
  props: Partial<React.ComponentProps<typeof LocalFolderReallowOverlay>> = {}
) {
  const i18n = initI18n('en')
  const onGrant = vi.fn()
  const onDecline = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <LocalFolderReallowOverlay
        open
        onGrant={onGrant}
        onDecline={onDecline}
        {...props}
      />
    </I18nextProvider>
  )
  return { onGrant, onDecline }
}

describe('LocalFolderReallowOverlay', () => {
  it('renders grant and decline actions', () => {
    renderOverlay()
    expect(screen.getByTestId('local-folder-reallow')).toBeInTheDocument()
    expect(screen.getByTestId('local-folder-reallow-grant')).toBeEnabled()
    expect(screen.getByTestId('local-folder-reallow-decline')).toBeEnabled()
  })

  it('calls handlers when actions are clicked', async () => {
    const user = userEvent.setup()
    const { onGrant, onDecline } = renderOverlay()

    await user.click(screen.getByTestId('local-folder-reallow-grant'))
    await user.click(screen.getByTestId('local-folder-reallow-decline'))

    expect(onGrant).toHaveBeenCalledTimes(1)
    expect(onDecline).toHaveBeenCalledTimes(1)
  })
})
