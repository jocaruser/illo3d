import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface OpenExistingStepProps {
  onBack: () => void
  onSuccess: () => void
  onSelectFolder: () => Promise<{ id: string; name: string } | null>
  onValidateFolder: (folderId: string) => Promise<
    | { ok: true; spreadsheetId: string; folderName: string; metadataVersion: string }
    | { ok: false; error: string }
  >
}

export function OpenExistingStep({
  onBack,
  onSuccess,
  onSelectFolder,
  onValidateFolder,
}: OpenExistingStepProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folderId, setFolderId] = useState('')

  const handleOpenPicker = () => {
    setError(null)
    setLoading(true)
    onSelectFolder()
      .then((result) => {
        if (!result) {
          setLoading(false)
          onBack()
          return
        }
        return onValidateFolder(result.id).then((validation) => {
          setLoading(false)
          if (validation.ok) {
            onSuccess()
          } else {
            const key =
              validation.error === 'not_shop'
                ? 'errorNotShop'
                : validation.error === 'version'
                  ? 'errorVersion'
                  : validation.error === 'permissions'
                    ? 'errorPermissions'
                    : 'errorGeneric'
            setError(t(`wizard.${key}`))
          }
        })
      })
      .catch((err) => {
        setLoading(false)
        setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
      })
  }

  const handleOpenByFolderId = () => {
    const trimmed = folderId.trim()
    if (!trimmed) {
      setError(t('wizard.folderIdEmpty'))
      return
    }
    setError(null)
    setLoading(true)
    onValidateFolder(trimmed)
      .then((validation) => {
        setLoading(false)
        if (validation.ok) {
          onSuccess()
        } else {
          const key =
            validation.error === 'not_shop'
              ? 'errorNotShop'
              : validation.error === 'version'
                ? 'errorVersion'
                : validation.error === 'permissions'
                  ? 'errorPermissions'
                  : 'errorGeneric'
          setError(t(`wizard.${key}`))
        }
      })
      .catch((err) => {
        setLoading(false)
        setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
      })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('wizard.openExisting')}
        </h3>
        <p className="text-gray-600">{t('wizard.opening')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('wizard.openExisting')}
      </h3>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleOpenPicker}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('wizard.openExisting')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('wizard.back')}
        </button>
      </div>
      <div className="border-t border-gray-200 pt-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('wizard.folderIdLabel')}
        </label>
        <input
          type="text"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          placeholder={t('wizard.folderIdPlaceholder')}
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mb-3 text-xs text-gray-500">{t('wizard.folderIdHelper')}</p>
        <button
          type="button"
          onClick={handleOpenByFolderId}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('wizard.openFolder')}
        </button>
      </div>
    </div>
  )
}

