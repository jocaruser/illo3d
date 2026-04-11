import { useEffect } from 'react'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useInventory } from '@/hooks/useInventory'
import { InventoryTable } from '@/components/InventoryTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
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

      <ConnectionStatus
        status={status}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {status === 'connected' && (
        <>
          {inventoryLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
              <p className="text-gray-600">{t('inventory.empty')}</p>
            </div>
          ) : (
            <InventoryTable items={items} />
          )}
        </>
      )}
    </div>
  )
}
