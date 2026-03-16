import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Backend } from '@/stores/backendStore'
import { useBackendStore } from '@/stores/backendStore'

interface CreateShopStepProps {
  backend: Backend | null
  onBack: () => void
  onSuccess: (folderName: string) => void
  onCreateShop: (folderName: string) => Promise<void>
}

export function CreateShopStep({
  backend,
  onBack,
  onSuccess,
  onCreateShop,
}: CreateShopStepProps) {
  const { t } = useTranslation()
  const [folderName, setFolderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLocalCsv = backend === 'local-csv'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocalCsv) {
      setError(null)
      setLoading(true)
      try {
        await onCreateShop('')
        onSuccess(useBackendStore.getState().localDirectoryHandle?.name ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
      } finally {
        setLoading(false)
      }
      return
    }
    const trimmed = folderName.trim()
    if (!trimmed) {
      setError(t('wizard.folderNamePlaceholder'))
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onCreateShop(trimmed)
      onSuccess(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleLocalCsvClick = () => {
    setError(null)
    setLoading(true)
    onCreateShop('')
      .then(() => {
        const name = useBackendStore.getState().localDirectoryHandle?.name ?? ''
        onSuccess(name)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
      })
      .finally(() => setLoading(false))
  }

  if (isLocalCsv) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('wizard.createNew')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('wizard.createLocalCsvHint')}
        </p>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {loading && (
          <p className="text-sm text-gray-600">{t('wizard.creating')}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('wizard.back')}
          </button>
          <button
            type="button"
            onClick={handleLocalCsvClick}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('wizard.create')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('wizard.createNew')}
      </h3>
      <div>
        <label htmlFor="folder-name" className="mb-2 block text-sm font-medium text-gray-700">
          {t('wizard.folderName')}
        </label>
        <input
          id="folder-name"
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder={t('wizard.folderNamePlaceholder')}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {loading && (
        <p className="text-sm text-gray-600">{t('wizard.creating')}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('wizard.back')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t('wizard.create')}
        </button>
      </div>
    </form>
  )
}
