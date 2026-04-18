import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useShopStore } from '../stores/shopStore'
import { useBackendStore } from '../stores/backendStore'

export function AuthStatus() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)
  const resetBackend = useBackendStore((s) => s.reset)

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
        {t('auth.signedInAs', { name: user.name })}
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
