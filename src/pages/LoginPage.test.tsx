import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

const mockExchangeSaToken = vi.fn()
vi.mock('@/services/auth/devLogin', () => ({
  exchangeSaToken: () => mockExchangeSaToken(),
}))

const mockValidateShopFolder = vi.fn()
vi.mock('@/services/drive/validation', () => ({
  validateShopFolder: (folderId: string) => mockValidateShopFolder(folderId),
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

  it('auto-sets shop when VITE_SA_FOLDER_ID is configured', async () => {
    vi.stubEnv('VITE_SA_CLIENT_EMAIL', 'sa@project.iam.gserviceaccount.com')
    vi.stubEnv('VITE_SA_FOLDER_ID', 'fixture-folder-id')
    mockExchangeSaToken.mockResolvedValue('access-token')
    mockValidateShopFolder.mockResolvedValue({
      ok: true,
      spreadsheetId: 'sheet-123',
      folderName: 'Fixture Shop',
      metadataVersion: '1.0.0',
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('login.devLogin'))

    await waitFor(() => {
      expect(mockValidateShopFolder).toHaveBeenCalledWith('fixture-folder-id')
    })
    expect(useShopStore.getState().activeShop).toEqual({
      folderId: 'fixture-folder-id',
      folderName: 'Fixture Shop',
      spreadsheetId: 'sheet-123',
      metadataVersion: '1.0.0',
    })
  })
})
