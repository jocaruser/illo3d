import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogShell } from '@/Component/dialog/DialogShell'

interface LocalFolderReallowOverlayProps {
  open: boolean
  busy?: boolean
  onGrant: () => void
  onDecline: () => void
}

/**
 * Blocking surface when a persisted local shop reloads but folder permission
 * has lapsed. Shown above the shell while `activeShop` remains in storage.
 */
export function LocalFolderReallowOverlay({
  open,
  busy = false,
  onGrant,
  onDecline,
}: LocalFolderReallowOverlayProps) {
  const { t } = useTranslation()
  const titleId = useId()

  return (
    <DialogShell open={open} onClose={onDecline} labelledBy={titleId}>
      <div data-testid="local-folder-reallow">
        <h2
          id={titleId}
          className="font-display text-xl font-semibold text-text"
        >
          {t('wizard.localFolderReallowTitle')}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {t('wizard.localFolderReallowMessage')}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-testid="local-folder-reallow-decline"
            className="btn-secondary"
            disabled={busy}
            onClick={onDecline}
          >
            {t('wizard.localFolderReallowDecline')}
          </button>
          <button
            type="button"
            data-testid="local-folder-reallow-grant"
            className="btn-primary"
            disabled={busy}
            onClick={onGrant}
          >
            {t('wizard.localFolderReallowGrant')}
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
