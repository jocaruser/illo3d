import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SetupWizardDefault, { SetupWizard } from '@/Component/wizard/SetupWizard'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useMigrationStore } from '@/Store/migrationStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { renderWithProviders } from '../helpers/renderWithProviders'

const {
  googleLoginConfig,
  useGoogleLogin,
  completeGoogleLogin,
  persistDirectoryHandle,
  readMetadata,
  createShopMock,
  validateShopFolder,
  hydrate,
  resolvePlanChain,
} = vi.hoisted(() => {
  const config: { current: Record<string, (arg?: unknown) => void> | null } = {
    current: null,
  }
  return {
    googleLoginConfig: config,
    useGoogleLogin: vi.fn(
      (options: Record<string, (arg?: unknown) => void>) => {
        config.current = options
        return vi.fn()
      }
    ),
    completeGoogleLogin: vi.fn(),
    persistDirectoryHandle: vi.fn(async () => undefined),
    readMetadata: vi.fn(),
    createShopMock: vi.fn(),
    validateShopFolder: vi.fn(),
    hydrate: vi.fn(),
    resolvePlanChain: vi.fn(() => [
      { fromMajor: 2, toMajor: 3, toVersion: '3.0.0', steps: [{ id: 'jobs' }] },
    ]),
  }
})

vi.mock('@react-oauth/google', () => ({ useGoogleLogin }))
vi.mock('@/Security/googleLogin', () => ({ completeGoogleLogin }))
vi.mock('@/Repository/LocalCsv/persistDirectoryHandle', () => ({
  persistDirectoryHandle,
}))
vi.mock('@/Repository/LocalCsv/LocalCsvFolderRepository', () => ({
  LocalCsvFolderRepository: vi.fn(function () {
    return { readMetadata }
  }),
}))
vi.mock('@/Repository/LocalCsv/LocalCsvWorkbookRepository', () => ({
  LocalCsvWorkbookRepository: vi.fn(function () {
    return {}
  }),
}))
vi.mock('@/Repository/GSheet/GDriveFolderRepository', () => ({
  GDriveFolderRepository: vi.fn(function () {
    return {}
  }),
}))
vi.mock('@/Repository/GSheet/GSheetWorkbookRepository', () => ({
  GSheetWorkbookRepository: class {
    async createWorkbook(): Promise<string> {
      return 'SS-1'
    }
  },
}))
vi.mock('@/Repository/GSheet/DriveFiles', () => ({
  createFolder: vi.fn(async () => 'FOLDER-1'),
  moveFileToFolder: vi.fn(async () => undefined),
}))
vi.mock('@/Service/ShopProvisioningService', () => ({
  ShopProvisioningService: vi.fn(function () {
    return { createShop: createShopMock }
  }),
}))
vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(() => ({ readMetadata })),
  getWorkbookRepository: vi.fn(() => ({})),
}))
vi.mock('@/Service/ShopValidationService', () => ({
  ShopValidationService: vi.fn(function () {
    return { validateShopFolder }
  }),
}))
vi.mock('@/Service/WorkbookService', () => ({
  WorkbookService: vi.fn(function () {
    return { hydrate }
  }),
}))
vi.mock('@/Migration/registry', () => ({ resolvePlanChain }))
vi.mock('@/Migration/orchestrator', () => ({
  runPlans: vi.fn(async () => ({ ok: true })),
}))
vi.mock('@/Migration/Target/LocalCsvMigrationTarget', () => ({
  createLocalCsvMigrationTarget: vi.fn(() => ({})),
}))
vi.mock('@/Migration/Target/GSheetMigrationTarget', () => ({
  createGSheetMigrationTarget: vi.fn(() => ({})),
}))

const handle = { name: 'my-shop' } as unknown as FileSystemDirectoryHandle

const shop = {
  folderId: 'my-shop',
  folderName: 'my-shop',
  spreadsheetId: 'local-my-shop',
  metadataVersion: '3.0.0',
}

const metadata = {
  app: 'illo3d' as const,
  version: '3.0.0',
  spreadsheetId: 'local-my-shop',
  createdAt: '2026-07-16T10:00:00.000Z',
  createdBy: 'local',
}

function abortError(): Error {
  const error = new Error('The user aborted a request.')
  error.name = 'AbortError'
  return error
}

/** Drive the mocked GIS popup to a successful token response. */
async function signInWithGoogle(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('wizard-google-drive'))
  await googleLoginConfig.current?.onSuccess?.({
    access_token: 'tok',
    expires_in: 3599,
  })
  await screen.findByTestId('wizard-google-create')
}

describe('SetupWizard', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    googleLoginConfig.current = null
    completeGoogleLogin.mockImplementation(async () => {
      useAuthStore
        .getState()
        .login(
          { email: 'carlos@example.com', name: 'Carlos Ruiz' },
          { accessToken: 'tok', accessTokenExpiresAtMs: Date.now() + 3_600_000 }
        )
      useBackendStore.getState().setBackend('google-drive')
    })
    readMetadata.mockResolvedValue(metadata)
    createShopMock.mockResolvedValue(shop)
    validateShopFolder.mockResolvedValue({ ok: true, shop, metadata })
    hydrate.mockResolvedValue(undefined)
    window.showDirectoryPicker = vi.fn(async () => handle)
    useAuthStore.setState({ user: null, isAuthenticated: false })
    useShopStore.setState({ activeShop: null })
    useBackendStore.setState({ backend: null, localDirectoryHandle: null })
    useMigrationStore.getState().reset()
    useWorkbookStore.getState().reset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.showDirectoryPicker
  })

  it('exports the same component as a default and a named export', () => {
    expect(SetupWizardDefault).toBe(SetupWizard)
  })

  it('opens on the welcome screen', () => {
    renderWithProviders(<SetupWizard />)

    expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()
  })

  describe('local folder', () => {
    it('signs in locally, picks a folder, and opens the shop it finds', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      await waitFor(() =>
        expect(useShopStore.getState().activeShop).toEqual(shop)
      )
      expect(useAuthStore.getState().user).toEqual({
        email: '',
        name: 'Local user',
      })
      expect(useBackendStore.getState().backend).toBe('local-csv')
      expect(useBackendStore.getState().localDirectoryHandle).toBe(handle)
      expect(persistDirectoryHandle).toHaveBeenCalledWith(handle)
      expect(validateShopFolder).toHaveBeenCalledWith('my-shop')
      // An existing shop needs no confirmation.
      expect(
        screen.queryByTestId('wizard-create-confirm-action')
      ).not.toBeInTheDocument()
    })

    it('opens the shop even when the handle cannot be persisted', async () => {
      // Persisting only saves a re-pick after reload; storage can fail (private
      // mode, quota) and must never strand the user on the picking screen.
      persistDirectoryHandle.mockRejectedValueOnce(new Error('DataCloneError'))
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      await waitFor(() =>
        expect(useShopStore.getState().activeShop).toEqual(shop)
      )
    })

    it('offers to create a shop when the folder holds no metadata', async () => {
      readMetadata.mockResolvedValue(null)
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(
        await screen.findByTestId('wizard-create-confirm-action')
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'Create a new illo3d shop in "my-shop"? Existing shop files will be overwritten.'
        )
      ).toBeInTheDocument()
      expect(validateShopFolder).not.toHaveBeenCalled()
    })

    it('creates the shop once the overwrite is confirmed', async () => {
      readMetadata.mockResolvedValue(null)
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))
      await user.click(
        await screen.findByTestId('wizard-create-confirm-action')
      )

      await waitFor(() =>
        expect(useShopStore.getState().activeShop).toEqual(shop)
      )
      expect(createShopMock).toHaveBeenCalledWith('local')
    })

    it('returns to welcome when the create confirmation is cancelled', async () => {
      readMetadata.mockResolvedValue(null)
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))
      await user.click(
        await screen.findByTestId('wizard-create-confirm-cancel')
      )

      expect(
        screen.queryByTestId('wizard-create-confirm-action')
      ).not.toBeInTheDocument()
      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useBackendStore.getState().backend).toBeNull()
    })

    it('surfaces a creation failure with a retry', async () => {
      readMetadata.mockResolvedValue(null)
      createShopMock.mockRejectedValue(new Error('Permission denied'))
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))
      await user.click(
        await screen.findByTestId('wizard-create-confirm-action')
      )

      const error = await screen.findByTestId('wizard-error')
      expect(error).toHaveTextContent('Permission denied')
      expect(useShopStore.getState().activeShop).toBeNull()

      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(screen.queryByTestId('wizard-error')).not.toBeInTheDocument()
    })

    it('returns to welcome silently when the picker is dismissed', async () => {
      window.showDirectoryPicker = vi.fn().mockRejectedValue(abortError())
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      await waitFor(() => expect(useAuthStore.getState().user).toBeNull())
      expect(screen.queryByTestId('wizard-error')).not.toBeInTheDocument()
      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
      expect(useBackendStore.getState().backend).toBeNull()
    })

    it('reports a picker failure that is not a dismissal', async () => {
      window.showDirectoryPicker = vi
        .fn()
        .mockRejectedValue(new Error('device busy'))
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Something went wrong. Please try again.'
      )
    })

    it('reports that Chrome is required on a browser without the picker', async () => {
      delete window.showDirectoryPicker
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Local folder storage needs a Chromium-based browser'
      )
      // Nothing was committed before the feature check.
      expect(useAuthStore.getState().user).toBeNull()
      expect(useBackendStore.getState().backend).toBeNull()
    })

    it('reports a failure while sniffing the folder for metadata', async () => {
      readMetadata.mockRejectedValue(new Error('unreadable'))
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Something went wrong. Please try again.'
      )
    })

    it('surfaces a validation error from the folder it opened', async () => {
      validateShopFolder.mockResolvedValue({ ok: false, error: 'not_shop' })
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'This folder is not an illo3d shop.'
      )
    })

    it('shows the picking indicator while the picker is open', async () => {
      let release: ((value: FileSystemDirectoryHandle) => void) | undefined
      window.showDirectoryPicker = vi.fn(
        () =>
          new Promise<FileSystemDirectoryHandle>(
            (resolve) => (release = resolve)
          )
      )
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(await screen.findByTestId('wizard-picking')).toHaveTextContent(
        'Opening folder picker…'
      )
      expect(screen.getByTestId('wizard-local-folder')).toBeDisabled()

      release?.(handle)
      await waitFor(() =>
        expect(useShopStore.getState().activeShop).toEqual(shop)
      )
    })
  })

  describe('google drive', () => {
    it('requests drive.file plus profile scopes', () => {
      renderWithProviders(<SetupWizard />)

      expect(useGoogleLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'https://www.googleapis.com/auth/drive.file profile email',
        })
      )
    })

    it('shows the Drive screen with the signed-in identity after login', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await signInWithGoogle(user)

      expect(completeGoogleLogin).toHaveBeenCalledWith({
        access_token: 'tok',
        expires_in: 3599,
      })
      expect(screen.getByTestId('wizard-google-user')).toHaveTextContent(
        'Carlos Ruiz'
      )
      expect(screen.getByTestId('wizard-google-open-picker')).toBeDisabled()
    })

    it('creates a new Drive shop', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      await signInWithGoogle(user)

      await user.click(screen.getByTestId('wizard-google-create'))

      await waitFor(() =>
        expect(useShopStore.getState().activeShop).toEqual(shop)
      )
      expect(createShopMock).toHaveBeenCalledWith('carlos@example.com')
    })

    it('surfaces a Drive creation failure', async () => {
      createShopMock.mockRejectedValue(new Error('Drive quota exceeded'))
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      await signInWithGoogle(user)

      await user.click(screen.getByTestId('wizard-google-create'))

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Drive quota exceeded'
      )
    })

    it('opens a shop by pasted folder id', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      await signInWithGoogle(user)

      await user.type(screen.getByTestId('wizard-folder-id'), 'FOLDER-9')
      await user.click(screen.getByTestId('wizard-google-open-by-id'))

      await waitFor(() =>
        expect(validateShopFolder).toHaveBeenCalledWith('FOLDER-9')
      )
      expect(useShopStore.getState().activeShop).toEqual(shop)
    })

    it('validates an empty folder id without calling the backend', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      await signInWithGoogle(user)

      await user.click(screen.getByTestId('wizard-google-open-by-id'))

      expect(screen.getByText('Please enter a folder ID')).toBeInTheDocument()
      expect(validateShopFolder).not.toHaveBeenCalled()
    })

    it('surfaces an open-by-id error', async () => {
      validateShopFolder.mockResolvedValue({
        ok: false,
        error: 'structure',
        detail: "missing sheet 'jobs'",
      })
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      await signInWithGoogle(user)

      await user.type(screen.getByTestId('wizard-folder-id'), 'FOLDER-9')
      await user.click(screen.getByTestId('wizard-google-open-by-id'))

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        "missing sheet 'jobs'"
      )
    })

    it('reports a failed sign-in', async () => {
      completeGoogleLogin.mockRejectedValue(new Error('userinfo 500'))
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-google-drive'))
      await googleLoginConfig.current?.onSuccess?.({
        access_token: 'tok',
        expires_in: 3599,
      })

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Sign-in did not complete. Please try again.'
      )
      expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()
    })

    it('reports an OAuth error', async () => {
      renderWithProviders(<SetupWizard />)

      await googleLoginConfig.current?.onError?.()

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Sign-in did not complete. Please try again.'
      )
    })

    it('reports a blocked popup', async () => {
      renderWithProviders(<SetupWizard />)

      await googleLoginConfig.current?.onNonOAuthError?.()

      expect(await screen.findByTestId('wizard-error')).toHaveTextContent(
        'Could not open the sign-in window. Allow pop-ups for this site and try again.'
      )
    })

    it('cancels out of the Drive screen with a full logout', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      await signInWithGoogle(user)

      await user.click(screen.getByTestId('wizard-google-cancel'))

      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useBackendStore.getState().backend).toBeNull()
      expect(useShopStore.getState().activeShop).toBeNull()
    })
  })

  describe('migration', () => {
    beforeEach(() => {
      validateShopFolder.mockResolvedValue({
        ok: false,
        error: 'version',
        shopVersion: '2.0.0',
        appVersion: '3.0.0',
      })
    })

    it('opens the migration modal on a version mismatch from the local path', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))

      expect(
        await screen.findByRole('dialog', { name: 'Migration Wizard' })
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Backup: pending')).toBeInTheDocument()
      expect(screen.queryByTestId('wizard-error')).not.toBeInTheDocument()
    })

    it('opens the migration modal on a version mismatch from the Drive path', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)
      // Sign-in itself must not be blocked by the pending mismatch.
      await user.click(screen.getByTestId('wizard-google-drive'))
      await googleLoginConfig.current?.onSuccess?.({
        access_token: 'tok',
        expires_in: 3599,
      })
      await screen.findByTestId('wizard-google-create')

      await user.type(screen.getByTestId('wizard-folder-id'), 'FOLDER-9')
      await user.click(screen.getByTestId('wizard-google-open-by-id'))

      expect(
        await screen.findByRole('dialog', { name: 'Migration Wizard' })
      ).toBeInTheDocument()
    })

    it('closes the modal and returns to welcome when the user logs out of it', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SetupWizard />)

      await user.click(screen.getByTestId('wizard-local-folder'))
      await screen.findByRole('dialog', { name: 'Migration Wizard' })

      await user.click(screen.getByTestId('wizard-migration-logout'))

      expect(
        screen.queryByRole('dialog', { name: 'Migration Wizard' })
      ).not.toBeInTheDocument()
      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useBackendStore.getState().backend).toBeNull()
    })
  })
})
