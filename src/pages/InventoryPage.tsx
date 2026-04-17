import { useMemo } from 'react'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { InventoryTable } from '@/components/InventoryTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { useTranslation } from 'react-i18next'
import type { Inventory } from '@/types/money'

function isActiveInventory(row: Inventory): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

export function InventoryPage() {
  const { t } = useTranslation()
  const {
    spreadsheetId,
    workbookStatus,
    workbookError,
    onRetry,
  } = useWorkbookConnection()

  const { inventory: allInventory, lots: allLots } = useWorkbookEntities()
  const items = useMemo(
    () => allInventory.filter(isActiveInventory),
    [allInventory],
  )
  const lots = useMemo(
    () =>
      allLots.filter((l) => l.archived !== 'true' && l.deleted !== 'true'),
    [allLots],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        {t('inventory.title')}
      </h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={onRetry}
        />
      ) : null}

      {workbookStatus === 'ready' && (
        <>
          {items.length === 0 ? (
            <EmptyState messageKey="inventory.empty" />
          ) : (
            <InventoryTable items={items} lots={lots} />
          )}
        </>
      )}
    </div>
  )
}
