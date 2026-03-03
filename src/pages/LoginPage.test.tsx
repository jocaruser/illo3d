import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '../stores/authStore'
import { useShopStore } from '../stores/shopStore'

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ isAuthenticated: false, user: null, credentials: null })
  useShopStore.setState({ activeShop: null })
})

describe('LoginPage', () => {
  it('renders login page with Google sign-in', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    expect(screen.getByText('login.title')).toBeInTheDocument()
    expect(screen.getByText('auth.signIn')).toBeInTheDocument()
  })

  it('shows Dev Login button in development mode', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText('login.devLogin')).toBeInTheDocument()
  })

  it('sets auth and shop stores on Dev Login click without network calls', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('login.devLogin'))

    expect(useAuthStore.getState().user).toEqual({
      email: 'dev@illo3d.local',
      name: 'Dev User',
    })
    expect(useAuthStore.getState().credentials).toEqual({
      accessToken: 'dev-fake-token',
    })
    expect(useShopStore.getState().activeShop).toEqual({
      folderId: 'dev-fixture-folder-id',
      folderName: 'Dev Fixture Shop',
      spreadsheetId: 'dev-fixture-spreadsheet-id',
      metadataVersion: '1.0.0',
    })
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
