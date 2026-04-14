import { useEffect } from 'react'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useInventory } from '@/hooks/useInventory'
import { InventoryTable } from '@/components/InventoryTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'

export function InventoryPage() {
  const { t } = useTranslation()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const {
    status,
    errorMessage,
    setConnecting,
    setConnected,
    setError,
  } = useSheetsStore()

  const { data: items = [], isLoading: inventoryLoading } =
    useInventory(spreadsheetId)

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
        {t('inventory.title')}
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
          {inventoryLoading ? (
            <LoadingSpinner />
          ) : items.length === 0 ? (
            <EmptyState messageKey="inventory.empty" />
          ) : (
            <InventoryTable items={items} />
          )}
        </>
      )}
    </div>
  )
}
