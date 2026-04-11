import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useClients } from '@/hooks/useClients'
import { ClientsTable } from '@/components/ClientsTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateClientPopup } from '@/components/CreateClientPopup'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'

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
  const [popupOpen, setPopupOpen] = useState(false)

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clients', spreadsheetId] })
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
              onClick={() => setPopupOpen(true)}
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
            <ClientsTable clients={clients} />
          )}
        </>
      )}

      <CreateClientPopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSuccess={handleSuccess}
        spreadsheetId={spreadsheetId}
      />
    </div>
  )
}
