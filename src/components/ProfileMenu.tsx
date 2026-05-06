import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import { useBackendStore } from '@/stores/backendStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { useShopMetadata } from '@/hooks/useShopMetadata'
import { useLocalAvatarUrl } from '@/hooks/useLocalAvatarUrl'
import { APP_VERSION } from '@/config/version'
import i18n from '@/i18n'

function InitialAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-400">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function ProfileMenu() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { user, isAuthenticated, logout } = useAuthStore()
  const activeShop = useShopStore((s) => s.activeShop)
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)
  const backend = useBackendStore((s) => s.backend)
  const localDirectoryHandle = useBackendStore((s) => s.localDirectoryHandle)
  const resetBackend = useBackendStore((s) => s.reset)
  const resetWorkbook = useWorkbookStore((s) => s.reset)
  const { language, theme, setLanguage, toggleTheme } = useUserPreferencesStore()

  const { data: metadata } = useShopMetadata()
  const localAvatarUrl = useLocalAvatarUrl(
    metadata?.iconsrc,
    localDirectoryHandle
  )

  const isLocal = backend === 'local-csv'

  const avatarSrc = isLocal
    ? localAvatarUrl
    : user?.picture

  const displayName = isLocal
    ? (metadata?.userName ?? t('profileMenu.localUserDefault'))
    : (user?.name ?? '')

  const driveFolderUrl =
    !isLocal && activeShop?.folderId
      ? `https://drive.google.com/drive/folders/${activeShop.folderId}`
      : null

  const folderName = activeShop?.folderName ?? localDirectoryHandle?.name ?? ''

  // Reset imgError when avatar source changes
  useEffect(() => {
    setImgError(false)
  }, [avatarSrc])

  // Apply theme class on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const handleSignOut = () => {
    clearActiveShop()
    resetBackend()
    resetWorkbook()
    logout()
    setIsOpen(false)
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-0.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800"
        aria-label={t('profileMenu.toggleMenu')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {avatarSrc && !imgError ? (
          <img
            src={avatarSrc}
            alt={displayName}
            className="h-8 w-8 rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <InitialAvatar name={displayName} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
          {/* Identity */}
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {avatarSrc && !imgError ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="h-10 w-10 rounded-full"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-base font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-400">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {displayName}
                </p>
                {!isLocal && user.email ? (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Shop Context */}
          {activeShop ? (
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              {driveFolderUrl ? (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {t('profileMenu.openDriveFolder')}
                </a>
              ) : isLocal ? (
                <p
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span className="truncate">{folderName}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Preferences */}
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('profileMenu.language')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                disabled={language === 'en'}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } disabled:cursor-not-allowed`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
                disabled={language === 'es'}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  language === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } disabled:cursor-not-allowed`}
              >
                Español
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('profileMenu.theme')}
            </p>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <span>
                {theme === 'light'
                  ? t('profileMenu.lightMode')
                  : t('profileMenu.darkMode')}
              </span>
              {theme === 'light' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* System */}
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              App {APP_VERSION} · OpenShop{' '}
              {metadata?.version ?? activeShop?.metadataVersion ?? '-'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400"
              >
                {t('profileMenu.editMetadata')}
              </button>
              <button
                type="button"
                disabled
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400"
              >
                {t('profileMenu.changelog')}
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
