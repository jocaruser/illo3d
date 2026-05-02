import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import { ClientsTable } from '@/components/ClientsTable'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { useTranslation } from 'react-i18next'
import { updateClient } from '@/services/client/updateClient'
import { deleteClient } from '@/services/client/deleteClient'
import type { Client } from '@/types/money'
import type { UpdateClientPayload } from '@/services/client/updateClient'
import { toast } from '@/lib/toast'

function isActiveEntity(c: Client): boolean {
  return c.archived !== 'true' && c.deleted !== 'true'
}

export function ClientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()

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
  const [query, setQuery] = useState('')

  const clientPopupOpen = createOpen || editingClient !== null

  const handleMutationSuccess = (newClientId?: string) => {
    if (newClientId) {
      navigate(`/clients/${newClientId}`)
    }
  }

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
    try {
      await deleteClient(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('wizard.errorGeneric'),
      )
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {workbookStatus === 'ready' && (
        <>
          <ListTablePageHeader
            title={t('clients.title')}
            search={
              <ListTableSearchField
                value={query}
                onChange={setQuery}
                placeholder={t('listTable.searchPlaceholder')}
                ariaLabel={t('listTable.searchAria')}
              />
            }
            actions={
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setEditingClient(null)
                  setCreateOpen(true)
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('clients.addClient')}
              </button>
            }
          />

          {clients.length === 0 ? (
            <EmptyState messageKey="clients.empty" />
          ) : (
            <ClientsTable
              clients={clients}
              query={query}
              tagSearchLineByClientId={tagSearchLineByClientId}
              tagTitleByClientId={tagTitleByClientId}
              onEdit={(c) => {
                setCreateOpen(false)
                setEditingClient(c)
              }}
              onArchive={(c) => {
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
        }}
      >

      </ConfirmDialog>
    </div>
  )
}
