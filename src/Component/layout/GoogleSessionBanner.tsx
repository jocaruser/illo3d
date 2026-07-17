import { useTranslation } from 'react-i18next'
import { AlertStrip } from '@/Component/AlertStrip'
import { ensureGoogleAccessToken } from '@/Security/GoogleSession'
import { useAuthStore } from '@/Store/authStore'

const handleReauthenticate = (): void => {
  void ensureGoogleAccessToken().catch(() => {
    // The auth store already flagged the failure; the banner stays put.
  })
}

/**
 * Surfaces a dead Google session. The retry runs the canonical token path from
 * a user gesture — which is exactly what silent renewal lacked when it failed;
 * success clears the flag through the auth store, failure re-raises it.
 */
export function GoogleSessionBanner() {
  const { t } = useTranslation()
  const needsReauth = useAuthStore((state) => state.googleSessionNeedsReauth)

  if (!needsReauth) return null

  return (
    <AlertStrip
      variant="warning"
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <span data-testid="google-session-banner">
        {t('auth.sessionRenewalFailed')}
      </span>
      <button
        type="button"
        className="btn-secondary py-1 text-xs"
        onClick={handleReauthenticate}
      >
        {t('auth.reauthenticateGoogle')}
      </button>
    </AlertStrip>
  )
}
