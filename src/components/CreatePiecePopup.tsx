import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPiece } from '@/services/piece/createPiece'
import type { Job } from '@/types/money'

interface CreatePiecePopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
  jobs: Job[]
  /** When set, job is fixed (e.g. job detail page) and the job picker is hidden. */
  presetJobId?: string
}

export function CreatePiecePopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  jobs,
  presetJobId,
}: CreatePiecePopupProps) {
  const { t } = useTranslation()
  const [jobQuery, setJobQuery] = useState('')
  const [jobId, setJobId] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [jobs]
  )

  const filteredJobs = useMemo(() => {
    const q = jobQuery.trim().toLowerCase()
    if (!q) return sortedJobs
    return sortedJobs.filter(
      (j) =>
        j.id.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    )
  }, [sortedJobs, jobQuery])

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setError(null)
    setFieldErrors({})
    if (presetJobId) {
      setJobId(presetJobId)
      const j = jobs.find((x) => x.id === presetJobId)
      setJobQuery(j ? `${j.id} — ${j.description}` : presetJobId)
    } else {
      setJobQuery('')
      setJobId('')
    }
  }, [isOpen, presetJobId, jobs])

  const selectedJob = jobs.find((j) => j.id === jobId)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!jobId) errs.job = t('pieces.validation.jobRequired')
    if (!name.trim()) errs.name = t('pieces.validation.nameRequired')
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      await createPiece(spreadsheetId, {
        job_id: jobId,
        name: name.trim(),
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t('pieces.createTitle')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {presetJobId ? (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">
                {t('pieces.job')}
              </p>
              {selectedJob ? (
                <p className="text-sm text-gray-600">
                  {t('pieces.selectedJob', {
                    id: selectedJob.id,
                    description: selectedJob.description,
                  })}
                </p>
              ) : (
                <p className="text-sm text-gray-600">{presetJobId}</p>
              )}
            </div>
          ) : (
            <div>
              <label
                htmlFor="piece-job-search"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('pieces.job')}
              </label>
              <input
                id="piece-job-search"
                type="text"
                value={jobQuery}
                onChange={(e) => setJobQuery(e.target.value)}
                placeholder={t('pieces.jobSearchPlaceholder')}
                disabled={loading}
                className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {selectedJob && (
                <p className="mb-2 text-sm text-gray-600">
                  {t('pieces.selectedJob', {
                    id: selectedJob.id,
                    description: selectedJob.description,
                  })}
                </p>
              )}
              <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200">
                {filteredJobs.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    {t('pieces.noJobsMatch')}
                  </p>
                ) : (
                  filteredJobs.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => {
                        setJobId(j.id)
                        setJobQuery(`${j.id} — ${j.description}`)
                      }}
                      disabled={loading}
                      className={`flex w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:bg-gray-100 ${
                        jobId === j.id ? 'bg-blue-50 font-medium' : ''
                      }`}
                    >
                      <span className="truncate">
                        {j.id} — {j.description}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {fieldErrors.job && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.job}</p>
              )}
            </div>
          )}
          <div>
            <label
              htmlFor="piece-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('pieces.name')}
            </label>
            <input
              id="piece-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('pieces.namePlaceholder')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('pieces.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : t('pieces.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
