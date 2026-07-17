import { useCallback, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClientsTable } from '@/Component/detail/ClientsTable'
import { CreateClientDialog } from '@/Component/detail/CreateClientDialog'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { toast } from '@/Component/Toast'
import type { Client } from '@/Entity/Client'
import { useEntityManager } from '@/Hook/useEntityManager'
import { LifecycleService } from '@/Service/LifecycleService'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { clientSearchBlob } from '@/Service/Search/searchBlobs'

export function ClientsPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [archiving, setArchiving] = useState<Client | null>(null)

  const clients = useMemo(() => em.clients.findActive(), [em, revision])

  /** Tag names per client id, used for the tooltip and for the search blob. */
  const tagNamesByClient = useMemo(() => {
    const names = new Map<string, string[]>()
    for (const link of em.tagLinks.findActive()) {
      if (link.entityType !== 'client') continue
      const tag = em.tags.find(link.tagId)
      if (tag === null || !tag.isActive()) continue
      names.set(link.entityId, [...(names.get(link.entityId) ?? []), tag.name])
    }
    return names
  }, [em, revision])

  const tagNames = useCallback(
    (clientId: string) => tagNamesByClient.get(clientId) ?? [],
    [tagNamesByClient]
  )

  const rows = useMemo(
    () =>
      fuzzyFilter(clients, query, (client) =>
        clientSearchBlob(client, tagNames(client.id).join(' '))
      ),
    [clients, query, tagNames]
  )

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setDialogOpen(true)
  }

  const handleSaved = (client: Client, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      void navigate(`/clients/${client.id}`)
      return
    }
    bump()
  }

  const confirmArchive = (client: Client) => {
    new LifecycleService(em).archiveClient(client.id)
    toast.success(t('toast.changeApplied'))
    setArchiving(null)
    bump()
  }

  const emptyMessage = clients.length === 0 ? t('clients.empty') : t('listTable.noMatches')

  return (
    <div className="space-y-6">
      <ListTablePageHeader
        title={t('clients.title')}
        search={<ListTableSearchField value={query} onChange={setQuery} />}
        actions={
          <button
            type="button"
            className="btn-primary"
            data-testid="add-client-button"
            onClick={openCreate}
          >
            {t('clients.addClient')}
          </button>
        }
      />

      <ClientsTable
        rows={rows}
        tagNames={tagNames}
        emptyMessage={emptyMessage}
        onEdit={openEdit}
        onArchive={setArchiving}
      />

      <CreateClientDialog
        open={dialogOpen}
        client={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />

      {archiving !== null && (
        <ConfirmDialog
          open
          title={t('clients.archiveConfirmTitle')}
          message={t('clients.archiveConfirmMessage', { name: archiving.name })}
          confirmLabel={t('lifecycle.archive')}
          onConfirm={() => confirmArchive(archiving)}
          onCancel={() => setArchiving(null)}
        />
      )}
    </div>
  )
}
