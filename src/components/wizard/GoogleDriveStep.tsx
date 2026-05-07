import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/stores/authStore'

interface GoogleDriveStepProps {
  user: User
  loading: boolean
  /** Shown while `loading` is true (e.g. creating shop, opening picker, validating folder). */
  statusMessage?: string | null
  error: string | null
  onCreateNew: () => void
  onOpenExisting: () => void
  onOpenByFolderId: (folderId: string) => void
  onCancel: () => void
}

export function GoogleDriveStep({
  user,
  loading,
  statusMessage,
  error,
  onCreateNew,
  onOpenExisting,
  onOpenByFolderId,
  onCancel,
}: GoogleDriveStepProps) {
  const { t } = useTranslation()
  const [folderId, setFolderId] = useState('')
  const [idError, setIdError] = useState<string | null>(null)

  useEffect(() => {
    if (error) setIdError(null)
  }, [error])

  const handleOpenById = () => {
    const trimmed = folderId.trim()
    if (!trimmed) {
      setIdError(t('wizard.folderIdEmpty'))
      return
    }
    setIdError(null)
    onOpenByFolderId(trimmed)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="h-10 w-10 shrink-0 rounded-full"
          />
        ) : null}
        <div>
          <h3 className="text-lg font-semibold text-text">{t('wizard.googleDriveTitle')}</h3>
          <p className="text-sm text-text-muted">{user.name}</p>
        </div>
      </div>

      <p className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
        {t('wizard.driveFileWarning')}
      </p>

      {loading && statusMessage ? (
        <p className="text-sm text-text-muted" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      {error ? <p className="text-sm text-danger" role="alert" aria-live="assertive">{error}</p> : null}
      {idError ? <p className="text-sm text-danger" role="alert" aria-live="assertive">{idError}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="wizard-google-create"
          disabled={loading}
          onClick={onCreateNew}
          className="btn-primary disabled:opacity-50"
        >
          {t('wizard.createNewShop')}
        </button>
        <button
          type="button"
          data-testid="wizard-google-open-picker"
          disabled={true}
          onClick={onOpenExisting}
          className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('wizard.openExistingComingSoon')}
        >
          {t('wizard.openExistingShop')}
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <label htmlFor="wizard-folder-id" className="mb-2 block text-sm font-medium text-text">
          {t('wizard.folderIdLabel')}
        </label>
        <input
          id="wizard-folder-id"
          type="text"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          disabled={loading}
          placeholder={t('wizard.folderIdPlaceholder')}
          className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-text disabled:bg-gray-100 dark:bg-gray-800"
        />
        <p className="mb-3 text-xs text-text-muted/60">{t('wizard.folderIdHelper')}</p>
        <button
          type="button"
          data-testid="wizard-google-open-by-id"
          disabled={loading}
          onClick={handleOpenById}
          className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text hover:bg-surface disabled:opacity-50"
        >
          {t('wizard.openButton')}
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          type="button"
          data-testid="wizard-google-cancel"
          onClick={onCancel}
          className="text-sm text-text-muted/60 hover:text-text"
        >
          {t('wizard.cancel')}
        </button>
      </div>
    </div>
  )
}
