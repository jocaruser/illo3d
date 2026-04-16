import { useMemo, useState } from 'react'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import { ClientsTable } from '@/components/ClientsTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { useTranslation } from 'react-i18next'
import { updateClient } from '@/services/client/updateClient'
import { deleteClient } from '@/services/client/deleteClient'
import type { Client } from '@/types/money'
import type { UpdateClientPayload } from '@/services/client/updateClient'

function isActiveEntity(c: Client): boolean {
  return c.archived !== 'true' && c.deleted !== 'true'
}

export function ClientsPage() {
  const { t } = useTranslation()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)

  const { clients: allClients, tags, tagLinks } = useWorkbookEntities()
  const clients = useMemo(
    () => allClients.filter(isActiveEntity),
    [allClients],
  )

  const { tagSearchLineByClientId, tagTitleByClientId } = useMemo(() => {
    const namesByClient = new Map<string, string[]>()
    for (const link of tagLinks) {
      if (link.entity_type !== 'client') continue
      const tag = tags.find((x) => x.id === link.tag_id)
      const label = tag?.name?.trim()
      if (!label) continue
      const list = namesByClient.get(link.entity_id) ?? []
      list.push(formatTagNameTitleCase(label))
      namesByClient.set(link.entity_id, list)
    }
    const search = new Map<string, string>()
    const title = new Map<string, string>()
    for (const [clientId, names] of namesByClient) {
      search.set(clientId, names.join(' '))
      title.set(clientId, names.join(', '))
    }
    return {
      tagSearchLineByClientId: search,
      tagTitleByClientId: title,
    }
  }, [tags, tagLinks])

  const [createOpen, setCreateOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const clientPopupOpen = createOpen || editingClient !== null

  const handleMutationSuccess = () => {}

  const handleUpdateClient = async (
    clientId: string,
    payload: UpdateClientPayload
  ) => {
    if (!spreadsheetId) return
    await updateClient(spreadsheetId, clientId, payload)
  }

  const closeClientPopup = () => {
    setCreateOpen(false)
    setEditingClient(null)
  }

  const confirmArchiveClient = async () => {
    if (!spreadsheetId || !archiveTarget) return
    setArchiveError(null)
    try {
      await deleteClient(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
    } catch (e) {
      setArchiveError(
        e instanceof Error ? e.message : t('wizard.errorGeneric'),
      )
    }
  }

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        {t('clients.title')}
      </h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={handleRetry}
        />
      ) : null}

      {workbookStatus === 'ready' && (
        <>
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingClient(null)
                setCreateOpen(true)
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('clients.addClient')}
            </button>
          </div>

          {clients.length === 0 ? (
            <EmptyState messageKey="clients.empty" />
          ) : (
            <ClientsTable
              clients={clients}
              tagSearchLineByClientId={tagSearchLineByClientId}
              tagTitleByClientId={tagTitleByClientId}
              onEdit={(c) => {
                setCreateOpen(false)
                setEditingClient(c)
              }}
              onArchive={(c) => {
                setArchiveError(null)
                setArchiveTarget(c)
              }}
            />
          )}
        </>
      )}

      <CreateClientPopup
        isOpen={clientPopupOpen}
        onClose={closeClientPopup}
        onSuccess={handleMutationSuccess}
        spreadsheetId={spreadsheetId}
        initialClient={editingClient}
        onUpdateClient={handleUpdateClient}
      />

      <ConfirmDialog
        isOpen={archiveTarget !== null}
        title={t('clients.archiveConfirmTitle')}
        message={t('clients.archiveConfirmMessage', {
          name: archiveTarget?.name ?? '',
        })}
        confirmLabel={t('lifecycle.archive')}
        cancelLabel={t('clients.cancel')}
        onConfirm={confirmArchiveClient}
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
