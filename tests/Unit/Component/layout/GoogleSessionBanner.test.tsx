import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleSessionBanner } from '@/Component/layout/GoogleSessionBanner'
import { ensureGoogleAccessToken } from '@/Security/GoogleSession'
import { useAuthStore } from '@/Store/authStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { renderLayout } from './renderLayout'

vi.mock('@/Security/GoogleSession', () => ({
  ensureGoogleAccessToken: vi.fn(),
}))

describe('GoogleSessionBanner', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    useAuthStore.getState().clearGoogleSessionNeedsReauth()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stays hidden while the session is healthy', () => {
    renderLayout(<GoogleSessionBanner />)

    expect(screen.queryByTestId('google-session-banner')).not.toBeInTheDocument()
  })

  it('warns when the session needs re-authentication', () => {
    act(() => {
      useAuthStore.getState().markGoogleSessionNeedsReauth()
    })

    renderLayout(<GoogleSessionBanner />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your Google sign-in expired. Save and sync may fail until you sign in again.'
    )
  })

  it('re-authenticates from a user gesture', async () => {
    vi.mocked(ensureGoogleAccessToken).mockResolvedValue('fresh-token')
    act(() => {
      useAuthStore.getState().markGoogleSessionNeedsReauth()
    })
    renderLayout(<GoogleSessionBanner />)

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google again' }))

    expect(ensureGoogleAccessToken).toHaveBeenCalledTimes(1)
  })

  it('leaves the banner up when re-authentication fails', async () => {
    vi.mocked(ensureGoogleAccessToken).mockRejectedValue(new Error('popup blocked'))
    act(() => {
      useAuthStore.getState().markGoogleSessionNeedsReauth()
    })
    renderLayout(<GoogleSessionBanner />)

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google again' }))

    expect(screen.getByTestId('google-session-banner')).toBeInTheDocument()
  })

  it('disappears once the session recovers', () => {
    act(() => {
      useAuthStore.getState().markGoogleSessionNeedsReauth()
    })
    renderLayout(<GoogleSessionBanner />)

    act(() => {
      useAuthStore.getState().clearGoogleSessionNeedsReauth()
    })

    expect(screen.queryByTestId('google-session-banner')).not.toBeInTheDocument()
  })
})
