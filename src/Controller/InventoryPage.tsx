import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  InventoryTable,
  type InventoryTableRow,
} from '@/Component/detail/InventoryTable'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useListTableDiscovery } from '@/Hook/useListTableDiscovery'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { inventorySearchBlob } from '@/Service/Search/searchBlobs'

/**
 * Inventory list. There is no create action here by design: inventory items are
 * born from a purchase, so the only way to add one is "Record purchase" with
 * "Add to inventory" on the transactions page.
 */
export function InventoryPage() {
  const { t } = useTranslation()
  const em = useEntityManager()

  const sourceRows = useMemo<InventoryTableRow[]>(
    () =>
      em.inventory.findActive().map((item) => ({
        item,
        avgUnitCost: computeAvgUnitCost(em.lots.findActiveByInventory(item.id)),
      })),
    [em]
  )

  const getSearchBlob = useCallback(
    (row: InventoryTableRow) => inventorySearchBlob(row.item, t),
    [t]
  )

  const { query, setQuery, rows, emptyMessage } = useListTableDiscovery({
    sourceRows,
    getSearchBlob,
    messages: {
      collectionEmpty: t('inventory.empty'),
      noMatches: t('listTable.noMatches'),
    },
  })

  return (
    <div className="space-y-4">
      <ListTablePageHeader
        title={t('inventory.title')}
        search={<ListTableSearchField value={query} onChange={setQuery} />}
      />
      <InventoryTable rows={rows} emptyMessage={emptyMessage} />
    </div>
  )
}
