import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { updateClient } from '@/services/client/updateClient'
import { deleteClient } from '@/services/client/deleteClient'
import type { UpdateClientPayload } from '@/services/client/updateClient'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ClientNotesSection } from '@/components/ClientNotesSection'
import { ClientTagsSection } from '@/components/ClientTagsSection'
import { MentionLinkify } from '@/components/MentionLinkify'
import { ClientJobsDiscoveryTable } from '@/components/ClientJobsDiscoveryTable'
import type { Client, ClientNote } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { computeClientDetailMetrics } from '@/utils/clientMetrics'

export function ClientDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId = '' } = useParams<{ clientId: string }>()
  const {
    spreadsheetId,
    workbookStatus,
    workbookError,
    onRetry,
  } = useWorkbookConnection()

  const {
    clients,
    jobs,
    pieces,
    pieceItems,
    inventory,
    lots,
    transactions,
    crmNotes,
    tags,
    tagLinks,
  } = useWorkbookEntities()
  const clientNotes = useMemo((): ClientNote[] => {
    const list = crmNotes
      .filter((n) => n.entity_type === 'client' && n.entity_id === clientId)
      .map(
        (n): ClientNote => ({
          id: n.id,
          client_id: n.entity_id,
          body: n.body,
          referenced_entity_ids: n.referenced_entity_ids,
          severity: n.severity,
          created_at: n.created_at,
        })
      )
    return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
  }, [crmNotes, clientId])

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
        lots,
      }),
    [
      clientId,
      jobs,
      transactions,
      pieces,
      pieceItems,
      inventory,
      lots,
    ]
  )

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [jobPopupOpen, setJobPopupOpen] = useState(false)

  const handleMutationSuccess = async () => {}

  const handleUpdateClient = async (
    cid: string,
    payload: UpdateClientPayload
  ) => {
    if (!spreadsheetId) return
    await updateClient(spreadsheetId, cid, payload)
  }

  const closeClientPopup = () => setEditingClient(null)

  const confirmArchiveClient = async () => {
    if (!spreadsheetId || !archiveTarget) return
    setArchiveError(null)
    try {
      await deleteClient(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
      navigate('/clients')
    } catch (e) {
      setArchiveError(
        e instanceof Error ? e.message : t('wizard.errorGeneric'),
      )
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
          ...(client.preferred_contact?.trim()
            ? [
                {
                  label: t('clients.preferredContact'),
                  value: client.preferred_contact.trim(),
                },
              ]
            : []),
          ...(client.lead_source?.trim()
            ? [
                {
                  label: t('clients.leadSource'),
                  value: (
                    <MentionLinkify
                      text={client.lead_source.trim()}
                      clients={clients}
                      jobs={jobs}
                      pieces={pieces}
                    />
                  ),
                },
              ]
            : []),
          ...(client.address?.trim()
            ? [
                {
                  label: t('clients.address'),
                  value: client.address.trim(),
                },
              ]
            : []),
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ConnectionStatus
        status={workbookStatus}
        errorMessage={workbookError}
        onRetry={onRetry}
      />

      {workbookStatus === 'ready' && clientId && !client && (
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

      {workbookStatus === 'ready' && client && (
        <>
          <EntityDetailPage
            backTo="/clients"
            backLabel={t('clientDetail.backToList')}
            title={client.name}
            fields={detailFields}
            editLabel={t('clients.editClient')}
            deleteLabel={t('lifecycle.archive')}
            onEdit={() => setEditingClient(client)}
            onDelete={() => {
              setArchiveError(null)
              setArchiveTarget(client)
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

            <ClientTagsSection
              spreadsheetId={spreadsheetId}
              clientId={clientId}
              tags={tags}
              tagLinks={tagLinks}
              onChanged={handleMutationSuccess}
            />

            <ClientNotesSection
              spreadsheetId={spreadsheetId}
              clientId={clientId}
              notes={clientNotes}
              clients={clients}
              jobs={jobs}
              pieces={pieces}
              onChanged={handleMutationSuccess}
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

            {clientJobs.length === 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colDescription')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colStatus')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colTotal')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        {t('jobs.colCreated')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={4}
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
              <ClientJobsDiscoveryTable
                jobs={clientJobs}
                pieces={pieces}
                clientName={client.name}
              />
            )}
          </EntityDetailPage>
        </>
      )}

      <CreateClientPopup
        isOpen={editingClient !== null}
        onClose={closeClientPopup}
        onSuccess={handleMutationSuccess}
        spreadsheetId={spreadsheetId}
        initialClient={editingClient}
        onUpdateClient={handleUpdateClient}
      />

      <CreateJobPopup
        isOpen={jobPopupOpen}
        onClose={() => setJobPopupOpen(false)}
        onSuccess={handleMutationSuccess}
        spreadsheetId={spreadsheetId}
        clients={clients}
        presetClientId={clientId}
      />

      <ConfirmDialog
        isOpen={archiveTarget !== null}
        title={t('clients.archiveConfirmTitle')}
        message={t('clients.archiveConfirmMessage', {
          name: archiveTarget?.name ?? '',
        })}
        confirmLabel={t('lifecycle.archive')}
        cancelLabel={t('clients.cancel')}
        onConfirm={() => void confirmArchiveClient()}
        onCancel={() => {
          setArchiveTarget(null)
          setArchiveError(null)
        }}
      >
        {archiveError ? (
          <p className="text-sm text-red-600">{archiveError}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
