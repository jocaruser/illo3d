import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Component/table/DataTable'
import type { InventoryType } from '@/Entity/InventoryItem'
import { useEntityManager } from '@/Hook/useEntityManager'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { formatCurrency } from '@/Service/Pricing/money'
import { computeRedos, redoBand, type RedoBand } from '@/Service/Pricing/redos'

interface JobMaterialsSummaryProps {
  jobId: string
  /** Bumped by the page so the summary recomputes after a piece edit. */
  revision?: number
}

export interface MaterialRow {
  inventoryId: string
  name: string
  type: InventoryType
  /** Σ(line quantity × piece units) across the job's pieces. */
  quantity: number
  /** Estimated cost at the item's average lot unit cost; null without lots. */
  cost: number | null
  remaining: number
  /** Filament only — other types show an em dash. */
  redos: number | null
  usedIn: string[]
}

const typeOrder: Record<InventoryType, number> = {
  filament: 0,
  consumable: 1,
  equipment: 2,
}

const bandClasses: Record<RedoBand, string> = {
  safe: 'text-success',
  tight: 'text-warning',
  risky: 'text-danger',
}

export function JobMaterialsSummary({
  jobId,
  revision = 0,
}: JobMaterialsSummaryProps) {
  const { t } = useTranslation()
  const em = useEntityManager()

  const rows = useMemo<MaterialRow[]>(() => {
    // Each entry keeps a Set mirror of the row's `usedIn` for constant-time checks.
    const byInventory = new Map<
      string,
      { row: MaterialRow; usedIn: Set<string> }
    >()
    for (const piece of em.pieces.findByJob(jobId)) {
      if (piece.isDeleted()) continue
      const units = piece.hasValidUnits() ? (piece.units as number) : 1
      for (const line of em.pieceItems.findActiveByPiece(piece.id)) {
        const item = em.inventory.find(line.inventoryId)
        if (item === null) continue
        const existing = byInventory.get(item.id)
        const quantity = (line.quantity ?? 0) * units
        if (existing === undefined) {
          byInventory.set(item.id, {
            row: {
              inventoryId: item.id,
              name: item.name,
              type: item.type,
              quantity,
              cost: null,
              remaining: item.qtyCurrent,
              redos: null,
              usedIn: [piece.name],
            },
            usedIn: new Set([piece.name]),
          })
        } else {
          existing.row.quantity += quantity
          if (!existing.usedIn.has(piece.name)) {
            existing.usedIn.add(piece.name)
            existing.row.usedIn.push(piece.name)
          }
        }
      }
    }

    const result: MaterialRow[] = []
    for (const { row } of byInventory.values()) {
      const unitCost = computeAvgUnitCost(
        em.lots.findActiveByInventory(row.inventoryId)
      )
      row.cost = unitCost === null ? null : unitCost * row.quantity
      row.redos =
        row.type === 'filament'
          ? computeRedos(row.remaining, row.quantity).redos
          : null
      result.push(row)
    }

    return result.sort((a, b) => {
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type]
      return a.name.localeCompare(b.name)
    })
  }, [em, jobId, revision])

  /** Overall risk = the tightest redo margin across the job's filament. */
  const overall = useMemo(() => {
    const filament = rows.filter((row) => row.redos !== null)
    if (filament.length === 0) return null
    const worst = filament.reduce(
      (min, row) => Math.min(min, row.redos as number),
      Infinity
    )
    return { redos: worst, band: redoBand(worst) }
  }, [rows])

  return (
    <section className="space-y-3" data-testid="job-materials-summary">
      <SectionHeading>{t('jobs.materialsSummaryTitle')}</SectionHeading>

      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t('jobs.materialsSummaryEmpty')}
        </p>
      ) : (
        <>
          <DataTable>
            <TableHead>
              <TableRow>
                <TableHeader>{t('jobs.materialsColInventory')}</TableHeader>
                <TableHeader>{t('jobs.materialsColQty')}</TableHeader>
                <TableHeader>{t('jobs.materialsColCost')}</TableHeader>
                <TableHeader>{t('jobs.materialsColRedos')}</TableHeader>
                <TableHeader>{t('jobs.materialsColRemaining')}</TableHeader>
                <TableHeader>{t('jobs.materialsColUsedIn')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.inventoryId}
                  data-testid={`job-material-row-${row.inventoryId}`}
                >
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.cost === null ? '—' : formatCurrency(row.cost)}
                  </TableCell>
                  <TableCell
                    className={cx(
                      'tabular-nums',
                      row.redos !== null && bandClasses[redoBand(row.redos)]
                    )}
                  >
                    {row.redos === null ? '—' : row.redos}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-muted">
                    {row.remaining}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {row.usedIn.join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>

          <p className="text-sm" data-testid="job-materials-overall-risk">
            {t('jobs.overallRisk')}:{' '}
            {overall === null ? (
              <span className="text-text-muted">
                {t('jobs.riskFactorNone')}
              </span>
            ) : (
              <span className={bandClasses[overall.band]}>
                {t('pieces.redo.safe', { count: overall.redos })}
              </span>
            )}
          </p>
        </>
      )}
    </section>
  )
}
