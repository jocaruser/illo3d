import { useMemo, useState } from 'react'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { InventoryTable } from '@/components/InventoryTable'
import { EmptyState } from '@/components/EmptyState'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { useTranslation } from 'react-i18next'
import type { Inventory } from '@/types/money'

function isActiveInventory(row: Inventory): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

export function InventoryPage() {
  const { t } = useTranslation()
  const {
    workbookStatus,
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
  const [query, setQuery] = useState('')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {workbookStatus === 'ready' && (
        <>
          <ListTablePageHeader
            title={t('inventory.title')}
            search={
              <ListTableSearchField
                value={query}
                onChange={setQuery}
                placeholder={t('listTable.searchPlaceholder')}
                ariaLabel={t('listTable.searchAria')}
              />
            }
          />

          {items.length === 0 ? (
            <EmptyState messageKey="inventory.empty" />
          ) : (
            <InventoryTable items={items} query={query} lots={lots} />
          )}
        </>
      )}
    </div>
  )
}
