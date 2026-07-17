import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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

export interface ExpenseLotDraft {
  quantity: string
  amount: string
}

export interface ExpenseLotRow {
  lot: Lot
  /** '' when the material no longer resolves; the row then shows the raw id. */
  materialName: string
  draft: ExpenseLotDraft
  quantityError: string
  amountError: string
}

interface ExpenseLotsTableProps {
  rows: ExpenseLotRow[]
  onChange: (lotId: string, patch: Partial<ExpenseLotDraft>) => void
}

const COLUMN_COUNT = 3

/**
 * The lots this expense bought. There is no purchase-date column: every lot
 * here shares the expense's own date, which the page already shows.
 */
export function ExpenseLotsTable({ rows, onChange }: ExpenseLotsTableProps) {
  const { t } = useTranslation()
  return (
    <section className="space-y-3">
      <SectionHeading>{t('expenseTransactionDetail.lotsTitle')}</SectionHeading>
      <DataTable>
        <TableHead>
          <TableRow>
            <TableHeader>
              {t('expenseTransactionDetail.lotDescription')}
            </TableHeader>
            <TableHeader>
              {t('expenseTransactionDetail.lotQuantity')}
            </TableHeader>
            <TableHeader>{t('expenseTransactionDetail.lotAmount')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow
              colSpan={COLUMN_COUNT}
              message={t('expenseTransactionDetail.lotsEmpty')}
            />
          ) : (
            rows.map(
              ({ lot, materialName, draft, quantityError, amountError }) => (
                <TableRow key={lot.id}>
                  <TableCell>
                    <Link
                      to={`/inventory/${lot.inventoryId}`}
                      data-testid={`expense-detail-lot-material-${lot.id}`}
                      className="text-primary hover:underline"
                    >
                      {materialName === '' ? lot.inventoryId : materialName}
                    </Link>
                  </TableCell>
                  <TableCell className="space-y-1">
                    <FormInput
                      aria-label={t('expenseTransactionDetail.lotQuantity')}
                      data-testid={`expense-detail-lot-quantity-input-${lot.id}`}
                      type="number"
                      step=".01"
                      min="0"
                      className="w-28"
                      value={draft.quantity}
                      onChange={(event) =>
                        onChange(lot.id, { quantity: event.target.value })
                      }
                    />
                    <FormError message={quantityError} />
                  </TableCell>
                  <TableCell className="space-y-1">
                    <FormInput
                      aria-label={t('expenseTransactionDetail.lotAmount')}
                      data-testid={`expense-detail-lot-amount-input-${lot.id}`}
                      type="number"
                      step=".01"
                      min="0"
                      className="w-28"
                      value={draft.amount}
                      onChange={(event) =>
                        onChange(lot.id, { amount: event.target.value })
                      }
                    />
                    <FormError message={amountError} />
                  </TableCell>
                </TableRow>
              )
            )
          )}
        </TableBody>
      </DataTable>
    </section>
  )
}
