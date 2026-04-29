import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileMenu } from './ProfileMenu'
import { useAuthStore } from '@/stores/authStore'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { clearTestPersistStorage } from '@/stores/persistStorage'
import i18n from '@/i18n'

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

describe('ProfileMenu', () => {
  beforeEach(() => {
    clearTestPersistStorage()
    // Reset stores
    useAuthStore.setState({
      user: null,
      credentials: null,
      isAuthenticated: false,
      googleSessionNeedsReauth: false,
    })
    useUserPreferencesStore.setState({
      language: 'en',
      theme: 'light',
    })
    // Reset i18n language
    i18n.changeLanguage('en')
  })

  it('should not render when not authenticated', () => {
    render(<ProfileMenu />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should render when authenticated', () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show user initial when no picture', () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should open menu on click', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('should change language when language button clicked', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      const esButton = screen.getByText('Español')
      fireEvent.click(esButton)
    })
    expect(useUserPreferencesStore.getState().language).toBe('es')
  })

  it('should toggle theme when theme button clicked', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      const themeButton = screen.getByText('profileMenu.lightMode')
      fireEvent.click(themeButton)
    })
    expect(useUserPreferencesStore.getState().theme).toBe('dark')
  })

  it('should close menu on outside click', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(
      <div>
        <ProfileMenu />
        <div data-testid="outside">Outside</div>
      </div>
    )
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
    fireEvent.mouseDown(screen.getByTestId('outside'))
    await waitFor(() => {
      expect(screen.queryByText('Test User')).not.toBeInTheDocument()
    })
  })

  it('should close menu on escape key', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByText('Test User')).not.toBeInTheDocument()
    })
  })

  it('should sign out when sign out button clicked', async () => {
    const logoutSpy = vi.fn()
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
      logout: logoutSpy,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      const signOutButton = screen.getByText('auth.signOut')
      fireEvent.click(signOutButton)
    })
    expect(logoutSpy).toHaveBeenCalled()
  })
})
