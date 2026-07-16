import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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

export interface InventoryConsumptionRow {
  /** The `piece_items` line id. */
  id: string
  /** Quantity of this material the BOM line consumes. */
  quantity: number | undefined
  pieceName: string
  /** '' when the piece's job no longer resolves, which leaves the row unlinked. */
  jobId: string
  jobLabel: string
}

interface InventoryConsumptionTableProps {
  rows: InventoryConsumptionRow[]
}

const COLUMN_COUNT = 3

/** Where this material is spent: one row per bill-of-materials line that uses it. */
export function InventoryConsumptionTable({ rows }: InventoryConsumptionTableProps) {
  const { t } = useTranslation()
  return (
    <section className="space-y-3">
      <SectionHeading>{t('inventoryDetail.consumptionTitle')}</SectionHeading>
      <DataTable>
        <TableHead>
          <TableRow>
            <TableHeader className="text-right">{t('inventoryDetail.quantity')}</TableHeader>
            <TableHeader>{t('inventoryDetail.piece')}</TableHeader>
            <TableHeader>{t('inventoryDetail.job')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT} message={t('inventoryDetail.consumptionEmpty')} />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-right">{row.quantity ?? '—'}</TableCell>
                <TableCell>{row.pieceName}</TableCell>
                <TableCell>
                  {row.jobId === '' ? (
                    row.jobLabel
                  ) : (
                    <Link
                      to={`/jobs/${row.jobId}`}
                      data-testid={`inventory-consumption-job-${row.id}`}
                      className="text-primary hover:underline"
                    >
                      {row.jobLabel}
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </section>
  )
}
