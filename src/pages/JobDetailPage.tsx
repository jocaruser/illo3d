import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreatePiecePopup } from '@/components/CreatePiecePopup'
import { CreatePieceItemPopup } from '@/components/CreatePieceItemPopup'
import { PiecesTable } from '@/components/PiecesTable'
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

  const listLoading = piecesLoading || itemsLoading

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <Link
          to="/jobs"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← {t('jobs.backToList')}
        </Link>
      </div>

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
        <>
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-2xl font-bold text-gray-800">
              {job.description}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">{t('jobs.colId')}:</span> {job.id}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">{t('jobs.colClient')}:</span>{' '}
              {clientName(clients, job.client_id)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">{t('jobs.colStatus')}:</span>{' '}
              {t(`jobs.status.${job.status}`)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">{t('jobs.colPrice')}:</span>{' '}
              {formatJobPrice(job.price)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">{t('jobs.colCreated')}:</span>{' '}
              {job.created_at}
            </p>
          </div>

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
        </>
      )}

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
