import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { RelativeTime } from '@/Component/RelativeTime'
import { toast } from '@/Component/Toast'
import { FormError } from '@/Component/form/FormError'
import { FormInput } from '@/Component/form/FormInput'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Component/table/DataTable'
import type { Lot } from '@/Entity/Lot'
import { parseNumericCell } from '@/Entity/SheetEntity'
import { useEntityManager } from '@/Hook/useEntityManager'
import { InventoryService } from '@/Service/InventoryService'

export interface InventoryLotRow {
  lot: Lot
  /** The purchase's concept, or '' when the transaction no longer resolves. */
  transactionLabel: string
}

interface InventoryLotsTableProps {
  rows: InventoryLotRow[]
}

const COLUMN_COUNT = 5

export function InventoryLotsTable({ rows }: InventoryLotsTableProps) {
  const { t } = useTranslation()
  return (
    <section className="space-y-3">
      <SectionHeading>{t('inventoryDetail.lotsTitle')}</SectionHeading>
      <DataTable>
        <TableHead>
          <TableRow>
            <TableHeader>{t('inventoryDetail.lotDate')}</TableHeader>
            <TableHeader>{t('inventoryDetail.lotQuantity')}</TableHeader>
            <TableHeader>{t('inventoryDetail.lotAmount')}</TableHeader>
            <TableHeader>{t('inventoryDetail.transaction')}</TableHeader>
            <TableHeader>{t('inventoryDetail.lotActions')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT} message={t('inventoryDetail.lotsEmpty')} />
          ) : (
            rows.map((row) => <LotRow key={row.lot.id} {...row} />)
          )}
        </TableBody>
      </DataTable>
    </section>
  )
}

/** One editable lot. Each row owns its draft so a failed save never touches its neighbours. */
function LotRow({ lot, transactionLabel }: InventoryLotRow) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [quantity, setQuantity] = useState(String(lot.quantity ?? ''))
  const [amount, setAmount] = useState(String(lot.amount ?? ''))
  const [error, setError] = useState('')

  const handleSave = () => {
    const result = new InventoryService(em).updateLot(lot.id, {
      quantity: parseNumericCell(quantity) ?? NaN,
      amount: parseNumericCell(amount) ?? NaN,
    })
    if (!result.ok) {
      setError(t(result.error))
      toast.error(t('inventoryDetail.lotSaveError'))
      return
    }
    setError('')
    toast.success(t('toast.saveSuccess'))
  }

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <RelativeTime value={lot.createdAt} />
      </TableCell>
      <TableCell>
        <FormInput
          aria-label={t('inventoryDetail.lotQuantity')}
          data-testid={`inventory-detail-lot-qty-${lot.id}`}
          type="number"
          step=".01"
          min="0"
          className="w-28"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </TableCell>
      <TableCell>
        <FormInput
          aria-label={t('inventoryDetail.lotAmount')}
          data-testid={`inventory-detail-lot-amount-${lot.id}`}
          type="number"
          step=".01"
          min="0"
          className="w-28"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </TableCell>
      <TableCell>
        <Link
          to={`/transactions/${lot.transactionId}`}
          data-testid={`inventory-lot-tx-${lot.id}`}
          className="text-primary hover:underline"
        >
          {transactionLabel === '' ? lot.transactionId : transactionLabel}
        </Link>
      </TableCell>
      <TableCell className="space-y-1">
        <button
          type="button"
          data-testid={`inventory-detail-save-lot-${lot.id}`}
          className="btn-secondary"
          onClick={handleSave}
        >
          {t('inventoryDetail.saveLot')}
        </button>
        <FormError message={error} />
      </TableCell>
    </TableRow>
  )
}
