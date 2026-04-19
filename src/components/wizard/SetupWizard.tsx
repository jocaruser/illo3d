import { useCallback, useEffect, useRef, useState } from 'react'
import { useGoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useTranslation } from 'react-i18next'
import { WelcomeStep } from './WelcomeStep'
import { CreateConfirmModal } from './CreateConfirmModal'
import { GoogleDriveStep } from './GoogleDriveStep'
import { useCreateShop } from '@/hooks/useCreateShop'
import { useOpenExistingShop } from '@/hooks/useOpenExistingShop'
import { useLocalFolderDetection } from '@/hooks/useLocalFolderDetection'
import { useAuthStore, type User } from '@/stores/authStore'
import { useBackendStore } from '@/stores/backendStore'
import { GOOGLE_DRIVE_OAUTH_SCOPE } from '@/services/google/oauthScopes'

interface GoogleUserInfo {
  email: string
  name: string
  picture?: string
}

type WizardScreen = 'welcome' | 'local-confirm' | 'google-drive'

type GoogleDriveBusyKind = 'create' | 'work'

interface SetupWizardProps {
  onCancel: () => void
}

function mapValidationError(
  code: string,
  t: (key: string) => string
): string {
  if (code === 'not_shop') return t('wizard.errorNotShop')
  if (code === 'version') return t('wizard.errorVersion')
  if (code === 'permissions') return t('wizard.errorPermissions')
  return t('wizard.errorGeneric')
}

export function SetupWizard({ onCancel }: SetupWizardProps) {
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  const loginAsLocalUser = useAuthStore((s) => s.loginAsLocalUser)
  const logout = useAuthStore((s) => s.logout)
  const googleUser = useAuthStore((s) => s.user)
  const { createShop, createShopInLocalFolder } = useCreateShop()
  const { selectFolder, validateAndSetShop } = useOpenExistingShop()
  const { pickFolder } = useLocalFolderDetection()
  const setBackend = useBackendStore((s) => s.setBackend)
  const setLocalDirectoryHandle = useBackendStore((s) => s.setLocalDirectoryHandle)
  const clearBackend = useBackendStore((s) => s.clearBackend)

  const [screen, setScreen] = useState<WizardScreen>('welcome')
  const [pendingLocalHandle, setPendingLocalHandle] =
    useState<FileSystemDirectoryHandle | null>(null)
  const [welcomeError, setWelcomeError] = useState<string | null>(null)
  const [googleDriveError, setGoogleDriveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [googleDriveBusyKind, setGoogleDriveBusyKind] = useState<GoogleDriveBusyKind | null>(
    null
  )
  const [googleDriveIntent, setGoogleDriveIntent] = useState(false)
  const googleEntryRef = useRef<'inactive' | 'google' | 'local'>('inactive')
  const screenRef = useRef<WizardScreen>('welcome')

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  const resetToWelcome = useCallback(() => {
    googleEntryRef.current = 'inactive'
    setGoogleDriveIntent(false)
    setScreen('welcome')
    setPendingLocalHandle(null)
    setWelcomeError(null)
    setGoogleDriveError(null)
    setBusy(false)
    setGoogleDriveBusyKind(null)
  }, [])

  const handleGoogleDriveOpen = useCallback(async () => {
    setGoogleDriveError(null)
    setGoogleDriveBusyKind('work')
    setBusy(true)
    try {
      const picked = await selectFolder()
      if (!picked) {
        return
      }
      const validation = await validateAndSetShop(picked.id)
      if (!validation.ok) {
        setGoogleDriveError(mapValidationError(validation.error, t))
      }
    } catch (err) {
      setGoogleDriveError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setBusy(false)
      setGoogleDriveBusyKind(null)
    }
  }, [selectFolder, validateAndSetShop, t])

  const handleGoogleDriveCreate = useCallback(async () => {
    setGoogleDriveError(null)
    setGoogleDriveBusyKind('create')
    setBusy(true)
    try {
      await createShop('illo3d')
    } catch (err) {
      setGoogleDriveError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setBusy(false)
      setGoogleDriveBusyKind(null)
    }
  }, [createShop, t])

  const handleGoogleDrivePasteId = useCallback(
    async (folderId: string) => {
      setGoogleDriveError(null)
      setGoogleDriveBusyKind('work')
      setBusy(true)
      try {
        const validation = await validateAndSetShop(folderId)
        if (!validation.ok) {
          setGoogleDriveError(mapValidationError(validation.error, t))
        }
      } catch (err) {
        setGoogleDriveError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
      } finally {
        setBusy(false)
        setGoogleDriveBusyKind(null)
      }
    },
    [validateAndSetShop, t]
  )

  const googleLogin = useGoogleLogin({
    scope: GOOGLE_DRIVE_OAUTH_SCOPE,
    onSuccess: async (tokenResponse) => {
      setWelcomeError(null)
      setBusy(true)
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo: GoogleUserInfo = await userInfoResponse.json()
        const userData: User = {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }
        const expiresIn = tokenResponse.expires_in
        const accessTokenExpiresAtMs =
          typeof expiresIn === 'number' && expiresIn > 0
            ? Date.now() + expiresIn * 1000
            : undefined
        login(userData, {
          accessToken: tokenResponse.access_token,
          accessTokenExpiresAtMs,
        })
        setBackend('google-drive')
        setGoogleDriveIntent(false)
        googleEntryRef.current = 'inactive'
        setScreen('google-drive')
      } catch {
        setWelcomeError(t('wizard.oauthFailed'))
      } finally {
        setBusy(false)
      }
    },
    onError: () => {
      setWelcomeError(t('wizard.oauthFailed'))
      setBusy(false)
    },
  })

  const handleOneTapSuccess = useCallback(
    (credentialResponse: { credential?: string }) => {
      if (googleEntryRef.current !== 'google' || screenRef.current !== 'welcome') {
        return
      }
      const cred = credentialResponse.credential
      if (!cred) {
        return
      }
      setWelcomeError(null)
      let hint: string | undefined
      try {
        const payload = jwtDecode<{ email?: string }>(cred)
        hint = payload.email
      } catch {
        hint = undefined
      }
      try {
        if (hint) {
          googleLogin({ hint })
        } else {
          googleLogin()
        }
      } catch {
        setWelcomeError(t('wizard.oauthPopupBlocked'))
      }
    },
    [googleLogin, t]
  )

  useGoogleOneTapLogin({
    onSuccess: handleOneTapSuccess,
    disabled: screen !== 'welcome' || !googleDriveIntent || busy,
    cancel_on_tap_outside: true,
  })

  const handleSelectGoogleDrive = useCallback(() => {
    setWelcomeError(null)
    if (!googleDriveIntent) {
      googleEntryRef.current = 'google'
      setGoogleDriveIntent(true)
      return
    }
    try {
      googleLogin()
    } catch {
      setWelcomeError(t('wizard.oauthPopupBlocked'))
    }
  }, [googleDriveIntent, googleLogin, t])

  const handleSelectLocal = useCallback(async () => {
    googleEntryRef.current = 'local'
    setGoogleDriveIntent(false)
    setWelcomeError(null)
    setBusy(true)
    try {
      loginAsLocalUser()
      const picked = await pickFolder()
      if (!picked) {
        clearBackend()
        logout()
        setBusy(false)
        return
      }
      const { handle, metadata } = picked
      if (metadata) {
        setBackend('local-csv')
        setLocalDirectoryHandle(handle)
        const validation = await validateAndSetShop(handle.name)
        if (!validation.ok) {
          setWelcomeError(mapValidationError(validation.error, t))
          clearBackend()
          logout()
        }
        setBusy(false)
        return
      }
      setPendingLocalHandle(handle)
      setScreen('local-confirm')
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('wizard.errorGeneric')
      if (msg.includes('Chrome') || msg.includes('Chromium')) {
        setWelcomeError(t('wizard.chromeRequired'))
      } else {
        setWelcomeError(msg)
      }
      logout()
      clearBackend()
    } finally {
      setBusy(false)
    }
  }, [
    loginAsLocalUser,
    pickFolder,
    logout,
    setBackend,
    setLocalDirectoryHandle,
    validateAndSetShop,
    t,
    clearBackend,
  ])

  const handleLocalCreateConfirm = useCallback(async () => {
    if (!pendingLocalHandle) return
    setWelcomeError(null)
    setBusy(true)
    try {
      await createShopInLocalFolder(pendingLocalHandle)
      setPendingLocalHandle(null)
    } catch (err) {
      setWelcomeError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }, [pendingLocalHandle, createShopInLocalFolder, t])

  const handleLocalCreateCancel = useCallback(() => {
    setPendingLocalHandle(null)
    resetToWelcome()
    clearBackend()
    logout()
  }, [resetToWelcome, clearBackend, logout])

  const renderMain = () => {
    if (screen === 'google-drive' && googleUser) {
      return (
        <GoogleDriveStep
          user={googleUser}
          loading={busy}
          statusMessage={
            busy
              ? googleDriveBusyKind === 'create'
                ? t('wizard.creating')
                : t('wizard.opening')
              : null
          }
          error={googleDriveError}
          onCreateNew={() => void handleGoogleDriveCreate()}
          onOpenExisting={() => void handleGoogleDriveOpen()}
          onOpenByFolderId={(id) => void handleGoogleDrivePasteId(id)}
          onCancel={onCancel}
        />
      )
    }
    return (
      <WelcomeStep
        onSelectLocal={() => void handleSelectLocal()}
        onSelectGoogleDrive={handleSelectGoogleDrive}
        showGoogleDriveOAuthHint={googleDriveIntent}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        <h2 id="wizard-title" className="sr-only">
          {t('wizard.welcomeTitle')}
        </h2>
        {welcomeError ? <p className="mb-4 text-sm text-red-600">{welcomeError}</p> : null}
        {busy && screen === 'welcome' ? (
          <p className="mb-4 text-sm text-gray-600">{t('wizard.pickingFolder')}</p>
        ) : null}
        {renderMain()}
      </div>
      {screen === 'local-confirm' && pendingLocalHandle ? (
        <CreateConfirmModal
          folderDisplayName={pendingLocalHandle.name}
          onConfirm={() => void handleLocalCreateConfirm()}
          onCancel={handleLocalCreateCancel}
        />
      ) : null}
    </div>
  )
}
