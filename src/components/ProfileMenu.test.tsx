import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileMenu } from './ProfileMenu'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import { useBackendStore } from '@/stores/backendStore'
import { useWorkbookStore } from '@/stores/workbookStore'
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

vi.mock('@/hooks/useShopMetadata', () => ({
  useShopMetadata: vi.fn(() => ({ data: null, error: null, loading: false })),
}))

vi.mock('@/hooks/useLocalAvatarUrl', () => ({
  useLocalAvatarUrl: vi.fn(() => null),
}))

vi.mock('@/config/version', () => ({
  APP_VERSION: '1.0.3',
}))

import { useShopMetadata } from '@/hooks/useShopMetadata'

describe('ProfileMenu', () => {
  beforeEach(() => {
    clearTestPersistStorage()
    useAuthStore.setState({
      user: null,
      credentials: null,
      isAuthenticated: false,
      googleSessionNeedsReauth: false,
    })
    useShopStore.setState({ activeShop: null })
    useBackendStore.setState({ backend: null, localDirectoryHandle: null })
    useWorkbookStore.getState().reset()
    useUserPreferencesStore.setState({
      language: 'en',
      theme: 'light',
    })
    i18n.changeLanguage('en')
    vi.mocked(useShopMetadata).mockReturnValue({ data: null, error: null, loading: false })
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

  it('should sign out and clear all stores when sign out button clicked', async () => {
    const logoutSpy = vi.fn()
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
      logout: logoutSpy,
    })
    useShopStore.setState({
      activeShop: { folderId: 'f', folderName: 'Shop', spreadsheetId: 's', metadataVersion: '2.0.0' },
    })
    useBackendStore.setState({ backend: 'google-drive', localDirectoryHandle: null })
    useWorkbookStore.setState({ dirty: true, status: 'ready' })

    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      const signOutButton = screen.getByText('auth.signOut')
      fireEvent.click(signOutButton)
    })

    expect(logoutSpy).toHaveBeenCalled()
    expect(useShopStore.getState().activeShop).toBeNull()
    expect(useBackendStore.getState().backend).toBeNull()
    expect(useWorkbookStore.getState().dirty).toBe(false)
    expect(useWorkbookStore.getState().status).toBe('idle')
  })

  describe('Google user', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: { name: 'Google User', email: 'google@example.com', picture: 'https://example.com/avatar.png' },
        isAuthenticated: true,
      })
      useBackendStore.setState({ backend: 'google-drive', localDirectoryHandle: null })
      useShopStore.setState({
        activeShop: { folderId: 'folder123', folderName: 'MyShop', spreadsheetId: 's', metadataVersion: '1.0.3' },
      })
    })

    it('shows name, email, and avatar in Identity section', async () => {
      render(<ProfileMenu />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText('Google User')).toBeInTheDocument()
      })
      expect(screen.getByText('google@example.com')).toBeInTheDocument()
      const imgs = screen.getAllByAltText('Google User')
      expect(imgs).toHaveLength(2)
      expect(imgs[0]).toHaveAttribute('src', 'https://example.com/avatar.png')
      expect(imgs[1]).toHaveAttribute('src', 'https://example.com/avatar.png')
    })

    it('shows Drive folder link with correct href', async () => {
      render(<ProfileMenu />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      await waitFor(() => {
        const link = screen.getByText('profileMenu.openDriveFolder')
        expect(link).toHaveAttribute('href', 'https://drive.google.com/drive/folders/folder123')
        expect(link).toHaveAttribute('target', '_blank')
      })
    })
  })

  describe('Local user', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: { name: 'Local user', email: '', picture: undefined },
        isAuthenticated: true,
      })
      useBackendStore.setState({ backend: 'local-csv', localDirectoryHandle: null })
      useShopStore.setState({
        activeShop: { folderId: 'MyLocalShop', folderName: 'MyLocalShop', spreadsheetId: 'local-MyLocalShop', metadataVersion: '1.0.2' },
      })
    })

    it('shows metadata.userName and no email', async () => {
      vi.mocked(useShopMetadata).mockReturnValue({
        data: { app: 'illo3d', version: '1.0.2', spreadsheetId: 'local-MyLocalShop', createdAt: '', createdBy: '', userName: 'Workshop Owner' },
        error: null,
        loading: false,
      })
      render(<ProfileMenu />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText('Workshop Owner')).toBeInTheDocument()
      })
      expect(screen.queryByText('google@example.com')).not.toBeInTheDocument()
    })

    it('falls back to "Local user" when metadata.userName is absent', async () => {
      vi.mocked(useShopMetadata).mockReturnValue({
        data: { app: 'illo3d', version: '1.0.2', spreadsheetId: 'local-MyLocalShop', createdAt: '', createdBy: '' },
        error: null,
        loading: false,
      })
      render(<ProfileMenu />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText('profileMenu.localUserDefault')).toBeInTheDocument()
      })
    })

    it('shows local folder name', async () => {
      render(<ProfileMenu />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText('MyLocalShop')).toBeInTheDocument()
      })
    })
  })

  it('shows version row with app and shop versions', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    useShopStore.setState({
      activeShop: { folderId: 'f', folderName: 'Shop', spreadsheetId: 's', metadataVersion: '2.0.0' },
    })
    vi.mocked(useShopMetadata).mockReturnValue({
      data: { app: 'illo3d', version: '2.0.0', spreadsheetId: 's', createdAt: '', createdBy: '' },
      error: null,
      loading: false,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText(/App 1\.0\.3/)).toBeInTheDocument()
      expect(screen.getByText(/Shop 2\.0\.0/)).toBeInTheDocument()
    })
  })

  it('shows disabled Edit metadata.json and Changelog buttons', async () => {
    useAuthStore.setState({
      user: { name: 'Test User', email: 'test@example.com', picture: undefined },
      isAuthenticated: true,
    })
    render(<ProfileMenu />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      const editBtn = screen.getByText('profileMenu.editMetadata')
      const changelogBtn = screen.getByText('profileMenu.changelog')
      expect(editBtn).toBeDisabled()
      expect(changelogBtn).toBeDisabled()
    })
  })
})
