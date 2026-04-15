import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useClients } from '@/hooks/useClients'
import { useJobs } from '@/hooks/useJobs'
import { useTransactions } from '@/hooks/useTransactions'
import { usePieces } from '@/hooks/usePieces'
import { usePieceItems } from '@/hooks/usePieceItems'
import { useInventory } from '@/hooks/useInventory'
import { useExpenses } from '@/hooks/useExpenses'
import { useClientNotes } from '@/hooks/useClientNotes'
import { updateClient } from '@/services/client/updateClient'
import {
  CLIENT_DELETE_BLOCKED_JOBS,
  deleteClient,
} from '@/services/client/deleteClient'
import type { UpdateClientPayload } from '@/services/client/updateClient'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QueryError } from '@/components/QueryError'
import { ClientNotesSection } from '@/components/ClientNotesSection'
import type { Client, Job } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { computeClientDetailMetrics } from '@/utils/clientMetrics'
function formatJobPrice(price: number | undefined): string {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return '—'
  }
  return formatCurrency(price)
}

interface ClientJobsTableProps {
  jobs: Job[]
}

function ClientJobsTable({ jobs }: ClientJobsTableProps) {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colId')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colDescription')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colStatus')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colPrice')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colCreated')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <Link
                  to={`/jobs/${job.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {job.id}
                </Link>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                {job.description}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {t(`jobs.status.${job.status}`)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                {formatJobPrice(job.price)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {job.created_at}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ClientDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId = '' } = useParams<{ clientId: string }>()
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

  const {
    data: clients = [],
    isLoading: clientsLoading,
    isError: clientsError,
    refetch: refetchClients,
  } = useClients(spreadsheetId)
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    isError: jobsError,
    refetch: refetchJobs,
  } = useJobs(spreadsheetId)
  const { data: transactions = [] } = useTransactions(spreadsheetId)
  const { data: pieces = [] } = usePieces(spreadsheetId)
  const { data: pieceItems = [] } = usePieceItems(spreadsheetId)
  const { data: inventory = [] } = useInventory(spreadsheetId)
  const { data: expenses = [] } = useExpenses(spreadsheetId)
  const { data: clientNotes = [] } = useClientNotes(spreadsheetId)

  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  )

  const clientJobs = useMemo(
    () => jobs.filter((j) => j.client_id === clientId),
    [jobs, clientId]
  )

  const metrics = useMemo(
    () =>
      computeClientDetailMetrics({
        clientId,
        jobs,
        transactions,
        pieces,
        pieceItems,
        inventoryRows: inventory,
        expenses,
      }),
    [
      clientId,
      jobs,
      transactions,
      pieces,
      pieceItems,
      inventory,
      expenses,
    ]
  )

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [jobPopupOpen, setJobPopupOpen] = useState(false)

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

  const invalidateClients = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['clients', spreadsheetId],
    })
  }

  const invalidateNotes = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['client_notes', spreadsheetId],
    })
  }

  const handleUpdateClient = async (
    cid: string,
    payload: UpdateClientPayload
  ) => {
    if (!spreadsheetId) return
    const key = ['clients', spreadsheetId] as const
    const previous = queryClient.getQueryData<Client[]>(key)
    if (previous) {
      queryClient.setQueryData(
        key,
        previous.map((c) =>
          c.id === cid
            ? {
                ...c,
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                notes: payload.notes,
              }
            : c
        )
      )
    }
    try {
      await updateClient(spreadsheetId, cid, payload)
    } catch (e) {
      if (previous) {
        queryClient.setQueryData(key, previous)
      }
      throw e
    }
  }

  const closeClientPopup = () => setEditingClient(null)

  const confirmDeleteClient = async () => {
    if (!spreadsheetId || !deleteTarget) return
    setDeleteError(null)
    try {
      await deleteClient(spreadsheetId, deleteTarget.id)
      setDeleteTarget(null)
      await invalidateClients()
      navigate('/clients')
    } catch (e) {
      const msg =
        e instanceof Error && e.message === CLIENT_DELETE_BLOCKED_JOBS
          ? t('clients.deleteBlockedJobs')
          : e instanceof Error
            ? e.message
            : t('wizard.errorGeneric')
      setDeleteError(msg)
    }
  }

  const detailFields =
    client != null
      ? [
          { label: t('jobs.colId'), value: client.id },
          {
            label: t('clients.email'),
            value: client.email?.trim() ? client.email : '—',
          },
          {
            label: t('clients.phone'),
            value: client.phone?.trim() ? client.phone : '—',
          },
          { label: t('clients.createdAt'), value: client.created_at },
          ...(client.notes?.trim()
            ? [
                {
                  label: t('clientDetail.sheetNoteLabel'),
                  value: client.notes.trim(),
                },
              ]
            : []),
        ]
      : []

  const listLoading = clientsLoading || jobsLoading

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ConnectionStatus
        status={status}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {status === 'connected' && (clientsError || jobsError) && (
        <QueryError
          onRetry={() => {
            void refetchClients()
            void refetchJobs()
          }}
        />
      )}

      {status === 'connected' &&
        !clientsError &&
        !jobsError &&
        !clientsLoading &&
        clientId &&
        !client && (
          <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
            <p className="text-gray-600">{t('clientDetail.notFound')}</p>
            <Link
              to="/clients"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              {t('clientDetail.backToList')}
            </Link>
          </div>
        )}

      {status === 'connected' && client && (
        <>
          <EntityDetailPage
            backTo="/clients"
            backLabel={t('clientDetail.backToList')}
            title={client.name}
            fields={detailFields}
            editLabel={t('clients.editClient')}
            deleteLabel={t('clients.delete')}
            onEdit={() => setEditingClient(client)}
            onDelete={() => {
              setDeleteError(null)
              setDeleteTarget(client)
            }}
          >
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('clientDetail.metricPaidLedger')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(metrics.paidLedger)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('clientDetail.metricOutstanding')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(metrics.outstandingJobs)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('clientDetail.metricJobCount')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {metrics.jobCount}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('clientDetail.metricAvgJobPrice')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {metrics.averageJobPrice == null
                    ? '—'
                    : formatCurrency(metrics.averageJobPrice)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('clientDetail.metricMaterials')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(metrics.materialsEstimate)}
                </p>
              </div>
            </div>

            <ClientNotesSection
              spreadsheetId={spreadsheetId}
              clientId={clientId}
              notes={clientNotes}
              onChanged={invalidateNotes}
            />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-gray-800">
                {t('clientDetail.jobsTitle')}
              </h3>
              {clientJobs.length > 0 ? (
                <button
                  type="button"
                  data-testid="client-detail-add-job"
                  onClick={() => setJobPopupOpen(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('jobs.addJob')}
                </button>
              ) : null}
            </div>

            {listLoading ? (
              <LoadingSpinner />
            ) : clientJobs.length === 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colId')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colDescription')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colStatus')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colPrice')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colCreated')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-gray-600"
                      >
                        <p className="mb-4">{t('clientDetail.jobsEmpty')}</p>
                        <button
                          type="button"
                          data-testid="client-detail-add-job"
                          onClick={() => setJobPopupOpen(true)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          {t('jobs.addJob')}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <ClientJobsTable jobs={clientJobs} />
            )}
          </EntityDetailPage>
        </>
      )}

      <CreateClientPopup
        isOpen={editingClient !== null}
        onClose={closeClientPopup}
        onSuccess={() => {
          void invalidateClients()
        }}
        spreadsheetId={spreadsheetId}
        initialClient={editingClient}
        onUpdateClient={handleUpdateClient}
      />

      <CreateJobPopup
        isOpen={jobPopupOpen}
        onClose={() => setJobPopupOpen(false)}
        onSuccess={() => {
          void queryClient.invalidateQueries({
            queryKey: ['jobs', spreadsheetId],
          })
        }}
        spreadsheetId={spreadsheetId}
        clients={clients}
        presetClientId={clientId}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t('clients.deleteConfirmTitle')}
        message={t('clients.deleteConfirmMessage', {
          name: deleteTarget?.name ?? '',
        })}
        confirmLabel={t('clients.delete')}
        cancelLabel={t('clients.cancel')}
        onConfirm={() => void confirmDeleteClient()}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError(null)
        }}
      >
        {deleteError ? (
          <p className="text-sm text-red-600">{deleteError}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
