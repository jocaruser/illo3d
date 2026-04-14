import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { usePieces } from '@/hooks/usePieces'
import { usePieceItems } from '@/hooks/usePieceItems'
import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useInventory } from '@/hooks/useInventory'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreatePiecePopup } from '@/components/CreatePiecePopup'
import { CreatePieceItemPopup } from '@/components/CreatePieceItemPopup'
import { PiecesTable } from '@/components/PiecesTable'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Job } from '@/types/money'
import { formatCurrency } from '@/utils/money'

function clientName(
  clients: { id: string; name: string }[],
  clientId: string
): string {
  const c = clients.find((x) => x.id === clientId)
  return c?.name ?? clientId
}

function formatJobPrice(price: number | undefined): string {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return '—'
  }
  return formatCurrency(price)
}

export function JobDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const queryClient = useQueryClient()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const {
    status,
    errorMessage,
    setConnecting,
    setConnected,
    setError,
  } = useSheetsStore()

  const { data: jobs = [], isLoading: jobsLoading } = useJobs(spreadsheetId)
  const { data: clients = [] } = useClients(spreadsheetId)
  const { data: allPieces = [], isLoading: piecesLoading } =
    usePieces(spreadsheetId)
  const { data: pieceItems = [], isLoading: itemsLoading } =
    usePieceItems(spreadsheetId)
  const { data: inventory = [] } = useInventory(spreadsheetId)

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId])

  const pieces = useMemo(
    () => allPieces.filter((p) => p.job_id === jobId),
    [allPieces, jobId]
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null)
  const [linePieceId, setLinePieceId] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null)

  useEffect(() => {
    if (!spreadsheetId) return
    setConnecting()
    connect(spreadsheetId).then((result) => {
      if (result.ok) {
        setConnected(result.spreadsheetId)
      } else {
        setError(result.error)
      }
    })
  }, [spreadsheetId, setConnecting, setConnected, setError])

  const handleRetry = async () => {
    if (!spreadsheetId) return
    setConnecting()
    const result = await connect(spreadsheetId)
    if (result.ok) {
      setConnected(result.spreadsheetId)
    } else {
      setError(result.error)
    }
  }

  const invalidatePieces = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pieces', spreadsheetId] })
  }

  const invalidatePieceItems = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['piece_items', spreadsheetId],
    })
  }

  const invalidateJobs = async () => {
    await queryClient.invalidateQueries({ queryKey: ['jobs', spreadsheetId] })
  }

  const handleUpdateJob = async (
    jobIdParam: string,
    payload: UpdateJobPayload
  ) => {
    if (!spreadsheetId) return
    const key = ['jobs', spreadsheetId] as const
    const previous = queryClient.getQueryData<Job[]>(key)
    if (previous) {
      queryClient.setQueryData(
        key,
        previous.map((j) =>
          j.id === jobIdParam
            ? {
                ...j,
                description: payload.description,
                client_id: payload.client_id,
                price: payload.price,
              }
            : j
        )
      )
    }
    try {
      await updateJob(spreadsheetId, jobIdParam, payload)
    } catch (e) {
      if (previous) {
        queryClient.setQueryData(key, previous)
      }
      throw e
    }
  }

  const closeEditPopup = () => setEditingJob(null)

  const confirmDeleteJob = async () => {
    if (!spreadsheetId || !deleteTarget) return
    await deleteJob(spreadsheetId, deleteTarget.id)
    setDeleteTarget(null)
    await queryClient.invalidateQueries({ queryKey: ['jobs', spreadsheetId] })
    await queryClient.invalidateQueries({ queryKey: ['pieces', spreadsheetId] })
    await queryClient.invalidateQueries({
      queryKey: ['piece_items', spreadsheetId],
    })
    navigate('/jobs')
  }

  const listLoading = piecesLoading || itemsLoading

  const detailFields = job
    ? [
        { label: t('jobs.colId'), value: job.id },
        {
          label: t('jobs.colClient'),
          value: clientName(clients, job.client_id),
        },
        {
          label: t('jobs.colStatus'),
          value: t(`jobs.status.${job.status}`),
        },
        {
          label: t('jobs.colPrice'),
          value: formatJobPrice(job.price),
        },
        { label: t('jobs.colCreated'), value: job.created_at },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ConnectionStatus
        status={status}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {status === 'connected' && !jobsLoading && jobId && !job && (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
          <p className="text-gray-600">{t('jobs.jobNotFound')}</p>
          <Link
            to="/jobs"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            {t('jobs.backToList')}
          </Link>
        </div>
      )}

      {status === 'connected' && job && (
        <EntityDetailPage
          backTo="/jobs"
          backLabel={t('jobs.backToList')}
          title={job.description}
          fields={detailFields}
          editLabel={t('jobs.editJob')}
          deleteLabel={t('jobs.deleteJob')}
          onEdit={() => setEditingJob(job)}
          onDelete={() => setDeleteTarget(job)}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {t('pieces.title')}
            </h3>
            <button
              type="button"
              data-testid="add-piece-button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('pieces.addPiece')}
            </button>
          </div>

          {listLoading ? (
            <p className="text-gray-600">{t('pieces.loading')}</p>
          ) : pieces.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
              <p className="text-gray-600">{t('pieces.empty')}</p>
            </div>
          ) : (
            <PiecesTable
              pieces={pieces}
              jobs={jobs}
              pieceItems={pieceItems}
              inventory={inventory}
              expandedPieceId={expandedPieceId}
              onToggleExpand={(id) =>
                setExpandedPieceId((cur) => (cur === id ? null : id))
              }
              onOpenAddLine={(id) => setLinePieceId(id)}
              hideJobColumn
            />
          )}
        </EntityDetailPage>
      )}

      <CreateJobPopup
        isOpen={editingJob !== null}
        onClose={closeEditPopup}
        onSuccess={() => {
          void invalidateJobs()
        }}
        spreadsheetId={spreadsheetId}
        clients={clients}
        initialJob={editingJob}
        onUpdateJob={handleUpdateJob}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('jobs.confirmDeleteTitle')}
        message={t('jobs.confirmDeleteMessage', {
          id: deleteTarget?.id ?? '',
        })}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDeleteJob()
        }}
      />

      <CreatePiecePopup
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          void invalidatePieces()
        }}
        spreadsheetId={spreadsheetId}
        jobs={jobs}
        presetJobId={job?.id}
      />

      <CreatePieceItemPopup
        isOpen={linePieceId != null}
        onClose={() => setLinePieceId(null)}
        onSuccess={() => {
          void invalidatePieceItems()
        }}
        spreadsheetId={spreadsheetId}
        pieceId={linePieceId}
        inventory={inventory}
      />
    </div>
  )
}
