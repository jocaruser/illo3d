import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isGoogleDriveStyleShop } from '@/lib/googleDriveShop'
import { useAuthStore } from '../stores/authStore'
import { useShopStore } from '../stores/shopStore'
import { useBackendStore } from '../stores/backendStore'

export function AuthStatus() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout, credentials } = useAuthStore()
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)
  const activeShop = useShopStore((s) => s.activeShop)
  const backend = useBackendStore((s) => s.backend)
  const resetBackend = useBackendStore((s) => s.reset)

  const driveFolderHref = useMemo(() => {
    if (!credentials?.accessToken || !activeShop) return null
    if (!isGoogleDriveStyleShop(backend, activeShop)) return null
    return `https://drive.google.com/drive/folders/${activeShop.folderId}`
  }, [credentials?.accessToken, activeShop, backend])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {user.picture && (
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
      )}
      <span className="text-sm text-gray-700">
        {driveFolderHref ? (
          <>
            {t('auth.signedInAsLead')}
            <a
              href={driveFolderHref}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('auth.signedInNameOpensDriveFolder')}
            >
              {user.name}
            </a>
          </>
        ) : (
          t('auth.signedInAs', { name: user.name })
        )}
      </span>
      <button
        onClick={() => {
          clearActiveShop()
          resetBackend()
          logout()
        }}
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
      >
        {t('auth.signOut')}
      </button>
    </div>
  )
}
