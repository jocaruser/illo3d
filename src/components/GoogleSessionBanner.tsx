import { useGoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useBackendStore } from '@/stores/backendStore'
import { GOOGLE_DRIVE_OAUTH_SCOPE } from '@/services/google/oauthScopes'

export function GoogleSessionBanner() {
  const { t } = useTranslation()
  const googleSessionNeedsReauth = useAuthStore((s) => s.googleSessionNeedsReauth)
  const patchGoogleCredentials = useAuthStore((s) => s.patchGoogleCredentials)
  const clearGoogleSessionNeedsReauth = useAuthStore((s) => s.clearGoogleSessionNeedsReauth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const credentials = useAuthStore((s) => s.credentials)
  const backend = useBackendStore((s) => s.backend)

  const googleLogin = useGoogleLogin({
    scope: GOOGLE_DRIVE_OAUTH_SCOPE,
    onSuccess: (tokenResponse) => {
      const expiresIn = tokenResponse.expires_in
      const accessTokenExpiresAtMs =
        typeof expiresIn === 'number' && expiresIn > 0
          ? Date.now() + expiresIn * 1000
          : undefined
      patchGoogleCredentials({
        accessToken: tokenResponse.access_token,
        accessTokenExpiresAtMs,
      })
      clearGoogleSessionNeedsReauth()
    },
  })

  if (
    !googleSessionNeedsReauth ||
    backend !== 'google-drive' ||
    !isAuthenticated ||
    !credentials?.accessToken
  ) {
    return null
  }

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
      role="alert"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <p>{t('auth.sessionRenewalFailed')}</p>
        <button
          type="button"
          className="rounded-lg bg-amber-700 px-3 py-1 font-medium text-white hover:bg-amber-800"
          onClick={() => googleLogin()}
        >
          {t('auth.reauthenticateGoogle')}
        </button>
      </div>
    </div>
  )
}
