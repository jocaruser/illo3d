import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useClients } from '@/hooks/useClients'
import { ClientsTable } from '@/components/ClientsTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'
import { updateClient } from '@/services/client/updateClient'
import {
  CLIENT_DELETE_BLOCKED_JOBS,
  deleteClient,
} from '@/services/client/deleteClient'
import type { Client } from '@/types/money'
import type { UpdateClientPayload } from '@/services/client/updateClient'

export function ClientsPage() {
  const { t } = useTranslation()
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

  const { data: clients = [], isLoading: clientsLoading } =
    useClients(spreadsheetId)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const clientPopupOpen = createOpen || editingClient !== null

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clients', spreadsheetId] })
  }

  const handleUpdateClient = async (
    clientId: string,
    payload: UpdateClientPayload
  ) => {
    if (!spreadsheetId) return
    const key = ['clients', spreadsheetId] as const
    const previous = queryClient.getQueryData<Client[]>(key)
    if (previous) {
      queryClient.setQueryData(
        key,
        previous.map((c) =>
          c.id === clientId
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
      await updateClient(spreadsheetId, clientId, payload)
    } catch (e) {
      if (previous) {
        queryClient.setQueryData(key, previous)
      }
      throw e
    }
  }

  const closeClientPopup = () => {
    setCreateOpen(false)
    setEditingClient(null)
  }

  const confirmDeleteClient = async () => {
    if (!spreadsheetId || !deleteTarget) return
    setDeleteError(null)
    try {
      await deleteClient(spreadsheetId, deleteTarget.id)
      setDeleteTarget(null)
      handleMutationSuccess()
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        {t('clients.title')}
      </h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={status}
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
      ) : null}

      {status === 'connected' && (
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

          {clientsLoading ? (
            <LoadingSpinner />
          ) : clients.length === 0 ? (
            <EmptyState messageKey="clients.empty" />
          ) : (
            <ClientsTable
              clients={clients}
              onEdit={(c) => {
                setCreateOpen(false)
                setEditingClient(c)
              }}
              onDelete={(c) => {
                setDeleteError(null)
                setDeleteTarget(c)
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
        isOpen={deleteTarget !== null}
        title={t('clients.deleteConfirmTitle')}
        message={t('clients.deleteConfirmMessage', {
          name: deleteTarget?.name ?? '',
        })}
        confirmLabel={t('clients.delete')}
        cancelLabel={t('clients.cancel')}
        onConfirm={confirmDeleteClient}
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
