import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/stores/authStore'

interface GoogleDriveStepProps {
  user: User
  loading: boolean
  error: string | null
  onCreateNew: () => void
  onOpenExisting: () => void
  onOpenByFolderId: (folderId: string) => void
  onCancel: () => void
}

export function GoogleDriveStep({
  user,
  loading,
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
          <h3 className="text-lg font-semibold text-gray-800">{t('wizard.googleDriveTitle')}</h3>
          <p className="text-sm text-gray-600">{user.name}</p>
        </div>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t('wizard.driveFileWarning')}
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {idError ? <p className="text-sm text-red-600">{idError}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="wizard-google-create"
          disabled={loading}
          onClick={onCreateNew}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t('wizard.createNewShop')}
        </button>
        <button
          type="button"
          data-testid="wizard-google-open-picker"
          disabled={loading}
          onClick={onOpenExisting}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('wizard.openExistingShop')}
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <label htmlFor="wizard-folder-id" className="mb-2 block text-sm font-medium text-gray-700">
          {t('wizard.folderIdLabel')}
        </label>
        <input
          id="wizard-folder-id"
          type="text"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          disabled={loading}
          placeholder={t('wizard.folderIdPlaceholder')}
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 disabled:bg-gray-100"
        />
        <p className="mb-3 text-xs text-gray-500">{t('wizard.folderIdHelper')}</p>
        <button
          type="button"
          data-testid="wizard-google-open-by-id"
          disabled={loading}
          onClick={handleOpenById}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('wizard.openButton')}
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          type="button"
          data-testid="wizard-google-cancel"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t('wizard.cancel')}
        </button>
      </div>
    </div>
  )
}
