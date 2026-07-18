import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { ProfileMenu } from '@/Component/layout/ProfileMenu'
import { APP_VERSION } from '@/Config/version'
import { useShopMetadata } from '@/Hook/useShopMetadata'
import { applyTheme } from '@/Theme/initTheme'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useUserPreferencesStore } from '@/Store/userPreferencesStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { i18n, renderLayout } from './renderLayout'

vi.mock('@/Hook/useShopMetadata', () => ({ useShopMetadata: vi.fn() }))

vi.mock('@/Theme/initTheme', () => ({ applyTheme: vi.fn() }))

function mockMetadata(userName?: string) {
  vi.mocked(useShopMetadata).mockReturnValue({
    metadata:
      userName === undefined
        ? null
        : {
            app: 'illo3d',
            version: '3.0.0',
            spreadsheetId: 'sheet-1',
            createdAt: '2026-01-01',
            createdBy: 'local',
            userName,
          },
    loading: false,
    error: null,
  })
}

function openShop(folderName = 'My 3D Shop') {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName,
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

function signInWithGoogle(picture?: string) {
  useAuthStore
    .getState()
    .login(
      { email: 'carlos@example.com', name: 'Carlos Ruiz', picture },
      { accessToken: 'token', accessTokenExpiresAtMs: Date.now() + 3_600_000 }
    )
  useBackendStore.getState().setBackend('google-drive')
}

async function openMenu() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Toggle profile menu' })
  )
}

describe('ProfileMenu', () => {
  beforeEach(async () => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    mockMetadata()
    useAuthStore.getState().logout()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
    useUserPreferencesStore.setState({ language: 'en', theme: 'light' })
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('trigger', () => {
    it('is avatar-only and reports its state', async () => {
      renderLayout(<ProfileMenu />)
      const trigger = screen.getByRole('button', {
        name: 'Toggle profile menu',
      })

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      await openMenu()

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('toggles closed again', async () => {
      renderLayout(<ProfileMenu />)

      await openMenu()
      await openMenu()

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('shows the Google picture', () => {
      signInWithGoogle('https://example.com/me.jpg')

      renderLayout(<ProfileMenu />)

      expect(
        screen
          .getByRole('button', { name: 'Toggle profile menu' })
          .querySelector('img')
      ).toHaveAttribute('src', 'https://example.com/me.jpg')
    })

    it('falls back to the first initial when the picture fails', () => {
      signInWithGoogle('https://example.com/broken.jpg')
      renderLayout(<ProfileMenu />)

      fireEvent.error(
        screen
          .getByRole('button', { name: 'Toggle profile menu' })
          .querySelector('img') as HTMLImageElement
      )

      expect(
        screen.getByRole('button', { name: 'Toggle profile menu' })
      ).toHaveTextContent('C')
    })

    it('falls back to the first initial when there is no picture', () => {
      signInWithGoogle()

      renderLayout(<ProfileMenu />)

      expect(
        screen.getByRole('button', { name: 'Toggle profile menu' })
      ).toHaveTextContent('C')
    })
  })

  describe('identity', () => {
    it('shows the Google name and email', async () => {
      signInWithGoogle()
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument()
      expect(screen.getByText('carlos@example.com')).toBeInTheDocument()
    })

    it('shows the metadata user name and no email for a local shop', async () => {
      useAuthStore.getState().loginAsLocalUser()
      useBackendStore.getState().setBackend('local-csv')
      mockMetadata('Workshop Carlos')
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByText('Workshop Carlos')).toBeInTheDocument()
      expect(screen.queryByText(/@/)).not.toBeInTheDocument()
    })

    it('falls back to a generic local user name', async () => {
      useAuthStore.getState().loginAsLocalUser()
      useBackendStore.getState().setBackend('local-csv')
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByText('Local user')).toBeInTheDocument()
    })
  })

  describe('shop context', () => {
    it('links a Drive shop to its folder in a new tab', async () => {
      signInWithGoogle()
      openShop()
      renderLayout(<ProfileMenu />)

      await openMenu()

      const link = screen.getByRole('link', { name: /Open Drive folder/ })
      expect(link).toHaveAttribute(
        'href',
        'https://drive.google.com/drive/folders/folder-1'
      )
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveTextContent('My 3D Shop')
    })

    it('names the folder of a local shop without linking it', async () => {
      useAuthStore.getState().loginAsLocalUser()
      useBackendStore.getState().setBackend('local-csv')
      openShop('shop-folder')
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByText('Local folder')).toBeInTheDocument()
      expect(screen.getByText('shop-folder')).toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('omits the section with no shop open', async () => {
      signInWithGoogle()
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(
        screen.queryByRole('link', { name: /Open Drive folder/ })
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Local folder')).not.toBeInTheDocument()
    })
  })

  describe('preferences', () => {
    it('highlights the current language and disables it', async () => {
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByRole('menuitem', { name: 'EN' })).toBeDisabled()
      expect(screen.getByRole('menuitem', { name: 'Español' })).toBeEnabled()
    })

    it('switches language in the store and in i18next', async () => {
      renderLayout(<ProfileMenu />)
      await openMenu()

      await userEvent.click(screen.getByRole('menuitem', { name: 'Español' }))

      expect(useUserPreferencesStore.getState().language).toBe('es')
      expect(i18n.language).toBe('es')
    })

    it('toggles to dark and applies it immediately', async () => {
      renderLayout(<ProfileMenu />)
      await openMenu()

      await userEvent.click(screen.getByRole('menuitem', { name: 'Dark mode' }))

      expect(useUserPreferencesStore.getState().theme).toBe('dark')
      expect(applyTheme).toHaveBeenCalledWith('dark')
    })

    it('toggles back to light', async () => {
      useUserPreferencesStore.setState({ theme: 'dark' })
      renderLayout(<ProfileMenu />)
      await openMenu()

      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Light mode' })
      )

      expect(useUserPreferencesStore.getState().theme).toBe('light')
      expect(applyTheme).toHaveBeenCalledWith('light')
    })
  })

  describe('system', () => {
    it('shows the app and shop versions', async () => {
      openShop()
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByTestId('profile-menu-version')).toHaveTextContent(
        `App ${APP_VERSION} · Shop 3.0.0`
      )
    })

    it('dashes the shop version with no shop open', async () => {
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(screen.getByTestId('profile-menu-version')).toHaveTextContent(
        `App ${APP_VERSION} · Shop —`
      )
    })

    it('parks the unbuilt actions as disabled', async () => {
      renderLayout(<ProfileMenu />)

      await openMenu()

      expect(
        screen.getByRole('menuitem', { name: 'Edit metadata.json' })
      ).toBeDisabled()
      expect(screen.getByRole('menuitem', { name: 'Changelog' })).toBeDisabled()
    })
  })

  describe('sign out', () => {
    it('clears the session, the shop, the backend and the snapshot', async () => {
      signInWithGoogle()
      openShop()
      act(() => {
        useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
      })
      renderLayout(<ProfileMenu />)
      await openMenu()

      await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useShopStore.getState().activeShop).toBeNull()
      expect(useBackendStore.getState().backend).toBeNull()
      expect(useWorkbookStore.getState().dirty).toBe(false)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('dismissal', () => {
    it('closes on an outside click', async () => {
      renderLayout(
        <>
          <ProfileMenu />
          <button type="button">elsewhere</button>
        </>
      )
      await openMenu()

      await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('stays open when clicked inside', async () => {
      openShop()
      renderLayout(<ProfileMenu />)
      await openMenu()

      await userEvent.click(screen.getByTestId('profile-menu-version'))

      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('closes on Escape', async () => {
      renderLayout(<ProfileMenu />)
      await openMenu()

      await userEvent.keyboard('{Escape}')

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('ignores other keys', async () => {
      renderLayout(<ProfileMenu />)
      await openMenu()

      // Not Enter: focus sits on the trigger, which Enter would re-activate.
      await userEvent.keyboard('a')

      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })
})
