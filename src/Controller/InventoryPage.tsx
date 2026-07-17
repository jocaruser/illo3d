import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  InventoryTable,
  type InventoryTableRow,
} from '@/Component/detail/InventoryTable'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { useEntityManager } from '@/Hook/useEntityManager'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { inventorySearchBlob } from '@/Service/Search/searchBlobs'

/**
 * Inventory list. There is no create action here by design: inventory items are
 * born from a purchase, so the only way to add one is "Record purchase" with
 * "Add to inventory" on the transactions page.
 */
export function InventoryPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [query, setQuery] = useState('')

  const rows = useMemo<InventoryTableRow[]>(
    () =>
      em.inventory.findActive().map((item) => ({
        item,
        avgUnitCost: computeAvgUnitCost(em.lots.findActiveByInventory(item.id)),
      })),
    [em]
  )

  const visible = useMemo(
    () => fuzzyFilter(rows, query, (row) => inventorySearchBlob(row.item, t)),
    [rows, query, t]
  )

  return (
    <div className="space-y-4">
      <ListTablePageHeader
        title={t('inventory.title')}
        search={<ListTableSearchField value={query} onChange={setQuery} />}
      />
      <InventoryTable
        rows={visible}
        emptyMessage={
          rows.length === 0 ? t('inventory.empty') : t('listTable.noMatches')
        }
      />
    </div>
  )
}
