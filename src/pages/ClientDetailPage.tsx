import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { updateClient } from '@/services/client/updateClient'
import { deleteClient } from '@/services/client/deleteClient'
import type { UpdateClientPayload } from '@/services/client/updateClient'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ClientNotesSection } from '@/components/ClientNotesSection'
import { ClientTagsSection } from '@/components/ClientTagsSection'
import { MentionLinkify } from '@/components/MentionLinkify'
import { ClientJobsDiscoveryTable } from '@/components/ClientJobsDiscoveryTable'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import type { Client, ClientNote } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { computeClientDetailMetrics } from '@/utils/clientMetrics'
import { buildClientActivityTimeline } from '@/utils/buildClientActivityTimeline'
import { ClientActivityTimeline } from '@/components/ClientActivityTimeline'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { NotFoundCard } from '@/components/NotFoundCard'
import { StatCard } from '@/components/StatCard'

export function ClientDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId = '' } = useParams<{ clientId: string }>()
  const {
    spreadsheetId,
    workbookStatus,
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

  const activityEntries = useMemo(
    () =>
      buildClientActivityTimeline({
        clientId,
        crmNotes,
        jobs,
        transactions,
        tags,
        tagLinks,
      }),
    [clientId, crmNotes, jobs, transactions, tags, tagLinks]
  )

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [jobPopupOpen, setJobPopupOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleMutationSuccess = async (newJobId?: string) => {
    if (newJobId) {
      navigate(`/jobs/${newJobId}`)
    }
  }

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
      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {workbookStatus === 'ready' && clientId && !client && (
        <NotFoundCard
          message={t('clientDetail.notFound')}
          backTo="/clients"
          backLabel={t('clientDetail.backToList')}
        />
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
              <StatCard size="sm" label={t('clientDetail.metricPaidLedger')} value={formatCurrency(metrics.paidLedger)} />
              <StatCard size="sm" label={t('clientDetail.metricOutstanding')} value={formatCurrency(metrics.outstandingJobs)} />
              <StatCard size="sm" label={t('clientDetail.metricJobCount')} value={String(metrics.jobCount)} />
              <StatCard size="sm" label={t('clientDetail.metricAvgJobPrice')} value={metrics.averageJobPrice == null ? '—' : formatCurrency(metrics.averageJobPrice)} />
              <StatCard size="sm" label={t('clientDetail.metricMaterials')} value={formatCurrency(metrics.materialsEstimate)} />
            </div>

            <ClientTagsSection
              spreadsheetId={spreadsheetId}
              clientId={clientId}
              tags={tags}
              tagLinks={tagLinks}
              onChanged={handleMutationSuccess}
            />

            <ClientActivityTimeline
              entries={activityEntries}
              clients={clients}
              jobs={jobs}
              pieces={pieces}
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

            <ListTablePageHeader
              title={t('clientDetail.jobsTitle')}
              search={
                clientJobs.length > 0 ? (
                  <ListTableSearchField
                    value={query}
                    onChange={setQuery}
                    placeholder={t('listTable.searchPlaceholder')}
                    ariaLabel={t('listTable.searchAria')}
                  />
                ) : undefined
              }
              actions={
                <button
                  type="button"
                  data-testid="client-detail-add-job"
                  onClick={() => {
                    setQuery('')
                    setJobPopupOpen(true)
                  }}
                  className="btn-primary"
                >
                  {t('jobs.addJob')}
                </button>
              }
            />

            <ClientJobsDiscoveryTable
              jobs={clientJobs}
              query={query}
              pieces={pieces}
              clientName={client.name}
            />
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
          <p className="text-sm text-red-600 dark:text-red-400">{archiveError}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
