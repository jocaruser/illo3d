import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthStatus } from './AuthStatus'
import { useAuthStore } from '../stores/authStore'

vi.mock('@react-oauth/google', () => ({
  useGoogleOneTapLogin: vi.fn(),
  GoogleLogin: ({ onSuccess }: { onSuccess: (r: { credential: string }) => void }) => (
    <button onClick={() => onSuccess({ credential: 'mock-token' })}>
      Sign in with Google
    </button>
  ),
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/pic.jpg',
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { name: string }) => {
      const translations: Record<string, string> = {
        'auth.signIn': 'Sign in with Google',
        'auth.signedInAs': `Signed in as ${params?.name || ''}`,
        'auth.signOut': 'Sign out',
      }
      return translations[key] || key
    },
  }),
}))

describe('AuthStatus', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      credentials: null,
      isAuthenticated: false,
    })
  })

  it('renders nothing when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false })

    const { container } = render(<AuthStatus />)

    expect(container.firstChild).toBeNull()
  })

  it('shows user info when authenticated', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe', picture: 'https://example.com/pic.jpg' },
      credentials: { credential: 'token' },
      isAuthenticated: true,
    })

    render(<AuthStatus />)

    expect(screen.getByText('Signed in as John Doe')).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('logs out when sign out is clicked', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe' },
      credentials: { credential: 'token' },
      isAuthenticated: true,
    })

    render(<AuthStatus />)

    fireEvent.click(screen.getByText('Sign out'))

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })
})
