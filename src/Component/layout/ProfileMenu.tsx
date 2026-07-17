import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { APP_VERSION } from '@/Config/version'
import { useShopMetadata } from '@/Hook/useShopMetadata'
import { applyTheme } from '@/Theme/initTheme'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import {
  useUserPreferencesStore,
  type Language,
} from '@/Store/userPreferencesStore'
import { useWorkbookStore } from '@/Store/workbookStore'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'Español' },
]

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

/**
 * Identity, shop context, preferences, version and sign-out. The trigger is
 * the avatar alone — everything else lives behind it, so the header stays a
 * single row on small screens.
 */
export function ProfileMenu() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pictureFailed, setPictureFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const activeShop = useShopStore((state) => state.activeShop)
  const clearActiveShop = useShopStore((state) => state.clearActiveShop)
  const backend = useBackendStore((state) => state.backend)
  const clearBackend = useBackendStore((state) => state.clearBackend)
  const resetWorkbook = useWorkbookStore((state) => state.reset)
  const language = useUserPreferencesStore((state) => state.language)
  const setLanguage = useUserPreferencesStore((state) => state.setLanguage)
  const theme = useUserPreferencesStore((state) => state.theme)
  const setTheme = useUserPreferencesStore((state) => state.setTheme)
  const { metadata } = useShopMetadata()

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const isGoogleUser = user !== null && user.email !== ''
  const displayName = isGoogleUser
    ? user.name
    : (metadata?.userName ?? t('profileMenu.localUserDefault'))
  const picture = isGoogleUser ? user.picture : undefined
  const showPicture = picture !== undefined && picture !== '' && !pictureFailed

  const handleLanguage = (code: Language): void => {
    setLanguage(code)
    void i18n.changeLanguage(code)
  }

  const handleTheme = (): void => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const handleSignOut = (): void => {
    setOpen(false)
    logout()
    clearActiveShop()
    clearBackend()
    resetWorkbook()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="profile-menu-trigger"
        aria-label={t('profileMenu.toggleMenu')}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-alt text-sm font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        onClick={() => setOpen((current) => !current)}
      >
        {showPicture ? (
          <img
            src={picture}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            onError={() => setPictureFailed(true)}
          />
        ) : (
          <span aria-hidden="true">{initialOf(displayName)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          data-testid="profile-menu"
          className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-border bg-surface-elevated py-2 shadow-lg"
        >
          <div className="border-b border-border px-4 pb-3">
            <p className="truncate text-sm font-medium text-text">
              {displayName}
            </p>
            {isGoogleUser && (
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            )}
          </div>

          {activeShop !== null && (
            <div className="border-b border-border px-4 py-3">
              {backend === 'google-drive' ? (
                <a
                  href={`https://drive.google.com/drive/folders/${activeShop.folderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  {t('profileMenu.openDriveFolder')}
                  <span className="block truncate text-xs text-text-muted">
                    {activeShop.folderName}
                  </span>
                </a>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    {t('profileMenu.localFolder')}
                  </p>
                  <p className="truncate text-sm text-text">
                    {activeShop.folderName}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="border-b border-border px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-text-muted">
              {t('profileMenu.language')}
            </p>
            <div className="mt-2 flex gap-2">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  role="menuitem"
                  disabled={language === code}
                  className={cx(
                    'rounded-md border px-2 py-1 text-xs',
                    language === code
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-border text-text-muted hover:bg-surface-alt'
                  )}
                  onClick={() => handleLanguage(code)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              role="menuitem"
              className="mt-3 w-full rounded-md border border-border px-2 py-1 text-left text-xs text-text hover:bg-surface-alt"
              onClick={handleTheme}
            >
              {theme === 'dark'
                ? t('profileMenu.lightMode')
                : t('profileMenu.darkMode')}
            </button>
          </div>

          <div className="border-b border-border px-4 py-3">
            <p
              data-testid="profile-menu-version"
              className="text-xs text-text-muted"
            >
              {t('profileMenu.versionRow', {
                app: APP_VERSION,
                shop: activeShop?.metadataVersion ?? '—',
              })}
            </p>
            <button
              type="button"
              role="menuitem"
              disabled
              className="mt-2 block w-full text-left text-xs text-text opacity-50"
            >
              {t('profileMenu.editMetadata')}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled
              className="mt-1 block w-full text-left text-xs text-text opacity-50"
            >
              {t('profileMenu.changelog')}
            </button>
          </div>

          <button
            type="button"
            role="menuitem"
            className="mt-1 block w-full px-4 py-2 text-left text-sm text-danger hover:bg-surface-alt"
            onClick={handleSignOut}
          >
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
