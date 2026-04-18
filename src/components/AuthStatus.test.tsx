import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthStatus } from './AuthStatus'
import { useAuthStore } from '../stores/authStore'
import { useShopStore } from '../stores/shopStore'
import { useBackendStore } from '../stores/backendStore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { name?: string }) => {
      const translations: Record<string, string> = {
        'auth.signIn': 'Sign in with Google',
        'auth.signedInAs': `Signed in as ${params?.name || ''}`,
        'auth.signedInAsLead': 'Signed in as ',
        'auth.signedInNameOpensDriveFolder': 'Open shop folder in Google Drive',
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
      credentials: { accessToken: 'token' },
      isAuthenticated: true,
    })

    render(<AuthStatus />)

    expect(screen.getByText('Signed in as John Doe')).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('logs out when sign out is clicked', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe' },
      credentials: { accessToken: 'token' },
      isAuthenticated: true,
    })

    render(<AuthStatus />)

    fireEvent.click(screen.getByText('Sign out'))

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('links user name to Drive folder when backend is google-drive and shop has folderId', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe', picture: 'https://example.com/pic.jpg' },
      credentials: { accessToken: 'token' },
      isAuthenticated: true,
    })
    useBackendStore.setState({ backend: 'google-drive' })
    useShopStore.setState({
      activeShop: {
        folderId: 'folder-abc',
        folderName: 'Shop',
        spreadsheetId: 'sheet-1',
        metadataVersion: '1.0.0',
      },
    })

    render(<AuthStatus />)

    const link = screen.getByRole('link', { name: 'Open shop folder in Google Drive' })
    expect(link).toHaveTextContent('John Doe')
    expect(link).toHaveAttribute(
      'href',
      'https://drive.google.com/drive/folders/folder-abc',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not link user name for local-csv backend', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe' },
      credentials: { accessToken: 'token' },
      isAuthenticated: true,
    })
    useBackendStore.setState({ backend: 'local-csv' })
    useShopStore.setState({
      activeShop: {
        folderId: 'folder-abc',
        folderName: 'Shop',
        spreadsheetId: 'sheet-1',
        metadataVersion: '1.0.0',
      },
    })

    render(<AuthStatus />)

    expect(screen.queryByRole('link', { name: 'John Doe' })).not.toBeInTheDocument()
    expect(screen.getByText('Signed in as John Doe')).toBeInTheDocument()
  })

  it('does not link user name for google-drive when there is no active shop', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe' },
      credentials: { accessToken: 'token' },
      isAuthenticated: true,
    })
    useBackendStore.setState({ backend: 'google-drive' })
    useShopStore.setState({ activeShop: null })

    render(<AuthStatus />)

    expect(screen.queryByRole('link', { name: 'John Doe' })).not.toBeInTheDocument()
    expect(screen.getByText('Signed in as John Doe')).toBeInTheDocument()
  })

  it('does not link user name when folderId is empty', () => {
    useAuthStore.setState({
      user: { email: 'user@example.com', name: 'John Doe' },
      credentials: { accessToken: 'token' },
      isAuthenticated: true,
    })
    useBackendStore.setState({ backend: 'google-drive' })
    useShopStore.setState({
      activeShop: {
        folderId: '',
        folderName: 'Shop',
        spreadsheetId: 'sheet-1',
        metadataVersion: '1.0.0',
      },
    })

    render(<AuthStatus />)

    expect(screen.queryByRole('link', { name: 'John Doe' })).not.toBeInTheDocument()
    expect(screen.getByText('Signed in as John Doe')).toBeInTheDocument()
  })
})
