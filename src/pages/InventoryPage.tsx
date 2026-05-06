import { useMemo, useState } from 'react'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { InventoryTable } from '@/components/InventoryTable'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { useTranslation } from 'react-i18next'
import { isActiveRow, isActiveLot } from '@/lib/entityFilters'

export function InventoryPage() {
  const { t } = useTranslation()
  const {
    workbookStatus,
  } = useWorkbookConnection()

  const { inventory: allInventory, lots: allLots } = useWorkbookEntities()
  const items = useMemo(
    () => allInventory.filter(isActiveRow),
    [allInventory],
  )
  const lots = useMemo(
    () => allLots.filter(isActiveLot),
    [allLots],
  )
  const [query, setQuery] = useState('')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" aria-busy={workbookStatus !== 'ready'}>
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

          <InventoryTable items={items} query={query} lots={lots} />
        </>
      )}
    </div>
  )
}
