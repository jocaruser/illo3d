import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGoogleLogin } from '@react-oauth/google'
import { AlertBox } from '@/Component/AlertBox'
import { LoadingSpinner } from '@/Component/LoadingSpinner'
import { useCreateShop } from '@/Hook/useCreateShop'
import {
  useOpenShop,
  type MigrationCandidate,
  type OpenShopResult,
} from '@/Hook/useOpenShop'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { persistDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { OAUTH_SCOPE } from '@/Security/GoogleSession'
import { completeGoogleLogin } from '@/Security/googleLogin'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useMigrationStore } from '@/Store/migrationStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { CreateConfirmModal } from './CreateConfirmModal'
import { GoogleDriveStep } from './GoogleDriveStep'
import { MigrationWizardModal } from './MigrationWizardModal'
import { WelcomeStep } from './WelcomeStep'
import {
  isDirectoryPickerSupported,
  isPickerAbort,
  pickDirectory,
} from './directoryPicker'

/** Drive scopes: file access for the shop, profile/email to name the audit actor. */
const GOOGLE_SCOPES = `${OAUTH_SCOPE} profile email`

type Screen = 'welcome' | 'googleDrive'

/**
 * The gate: no active shop means no app, so this renders as a full-screen
 * overlay until a shop is opened or created.
 */
export function SetupWizard() {
  const { t } = useTranslation()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [pendingFolderName, setPendingFolderName] = useState<string | null>(
    null
  )
  const [candidate, setCandidate] = useState<MigrationCandidate | null>(null)
  const user = useAuthStore((state) => state.user)
  const { createShop, creating } = useCreateShop()
  const { openShop, opening } = useOpenShop()

  /** Every exit path lands here: no identity, no backend, no half-open shop. */
  const resetToWelcome = useCallback(() => {
    useAuthStore.getState().logout()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
    useMigrationStore.getState().reset()
    setScreen('welcome')
    setError(null)
    setPendingFolderName(null)
    setCandidate(null)
  }, [])

  /** Shared tail of every open: errors show, a version mismatch opens the modal. */
  const handleOpenResult = useCallback((result: OpenShopResult) => {
    if (result.ok) return
    if (result.kind === 'migration') {
      setCandidate(result.candidate)
      return
    }
    setError(result.message)
  }, [])

  const chooseLocal = useCallback(async () => {
    setError(null)
    if (!isDirectoryPickerSupported()) {
      setError(t('wizard.chromeRequired'))
      return
    }

    useAuthStore.getState().loginAsLocalUser()
    useBackendStore.getState().setBackend('local-csv')

    setPicking(true)
    let handle: FileSystemDirectoryHandle
    try {
      handle = await pickDirectory()
    } catch (pickError) {
      setPicking(false)
      // Dismissing the picker is a decision, not a failure — say nothing.
      if (isPickerAbort(pickError)) {
        resetToWelcome()
        return
      }
      setError(t('wizard.errorGeneric'))
      return
    }

    useBackendStore.getState().setLocalDirectoryHandle(handle)
    // Best-effort: the in-memory handle is what opens the shop. Persisting it
    // only saves a re-pick after a reload, so a storage failure (private mode,
    // quota, disabled storage) must not strand the user on this screen.
    await persistDirectoryHandle(handle).catch(() => {})

    try {
      // The folder's own contents decide create-vs-open: metadata means shop.
      const metadata = await new LocalCsvFolderRepository(handle).readMetadata(
        handle.name
      )
      setPicking(false)
      if (metadata === null) {
        setPendingFolderName(handle.name)
        return
      }
      handleOpenResult(await openShop(handle.name))
    } catch {
      setPicking(false)
      setError(t('wizard.errorGeneric'))
    }
  }, [handleOpenResult, openShop, resetToWelcome, t])

  const login = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: (tokenResponse) => {
      void (async () => {
        try {
          await completeGoogleLogin(tokenResponse)
          setError(null)
          setScreen('googleDrive')
        } catch {
          setError(t('wizard.oauthFailed'))
        }
      })()
    },
    onError: () => setError(t('wizard.oauthFailed')),
    onNonOAuthError: () => setError(t('wizard.oauthPopupBlocked')),
  })

  /** Success needs no handling — the shop goes active and the app takes over. */
  const create = useCallback(async () => {
    setError(null)
    const result = await createShop()
    if (!result.ok) setError(result.message)
  }, [createShop])

  const openFromDrive = useCallback(
    (folderId: string) => {
      setError(null)
      void openShop(folderId).then(handleOpenResult)
    },
    [handleOpenResult, openShop]
  )

  const busy = picking || creating || opening

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center p-6">
        {screen === 'welcome' ? (
          <WelcomeStep
            disabled={busy}
            onChooseLocal={() => void chooseLocal()}
            onChooseGoogle={() => login()}
          />
        ) : (
          <GoogleDriveStep
            user={user}
            busy={busy}
            onCreate={() => void create()}
            onOpen={openFromDrive}
            onCancel={resetToWelcome}
          />
        )}

        {picking && (
          <p
            data-testid="wizard-picking"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted"
          >
            <LoadingSpinner />
            {t('wizard.pickingFolder')}
          </p>
        )}

        {error !== null && (
          <div data-testid="wizard-error" className="mt-6">
            <AlertBox variant="danger">
              <p>{error}</p>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={() => setError(null)}
              >
                {t('errors.retry')}
              </button>
            </AlertBox>
          </div>
        )}
      </div>

      <CreateConfirmModal
        open={pendingFolderName !== null}
        folderName={pendingFolderName ?? ''}
        busy={creating}
        onConfirm={() => void create()}
        onCancel={resetToWelcome}
      />

      {candidate !== null && (
        <MigrationWizardModal candidate={candidate} onLogOut={resetToWelcome} />
      )}
    </div>
  )
}

export default SetupWizard
