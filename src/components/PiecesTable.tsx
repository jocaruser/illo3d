import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Inventory, Job, Lot, Piece, PieceItem } from '@/types/money'
import { piecePriceIsSet } from '@/utils/jobPiecePricing'
import { computePieceSuggestedPrice } from '@/utils/jobSuggestedPrice'
import { materialCostForPieceItemLine } from '@/utils/pieceItemMaterialCost'
import {
  pieceUnitsAreSet,
  pieceUnitsResolved,
} from '@/utils/pieceEffectiveInventory'
import { formatCurrency } from '@/utils/money'
import { PieceStatusDropdown } from '@/components/PieceStatusDropdown'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildPieceSearchBlob } from '@/lib/listTable/searchBlobs'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

function jobLabel(jobs: Job[], jobId: string): string {
  const j = jobs.find((x) => x.id === jobId)
  if (!j) return jobId
  return `${j.id} — ${j.description}`
}

function inventoryLabel(inventory: Inventory[], inventoryId: string): string {
  const inv = inventory.find((x) => x.id === inventoryId)
  if (!inv) return inventoryId
  return `${inv.name} (${inv.id})`
}

function redoDisplay(
  t: (key: string, opts?: Record<string, unknown>) => string,
  inv: Inventory | undefined,
  quantity: number
): { remaining: string; band: string; bandClass: string } {
  if (!inv) {
    return { remaining: '—', band: '', bandClass: '' }
  }
  const qty = inv.qty_current
  const remaining =
    inv.type === 'filament'
      ? t('pieces.inventoryRemainingGrams', { qty })
      : t('pieces.inventoryRemainingUnits', { qty })
  const q = quantity > 0 ? quantity : 1
  const redos = Math.max(0, Math.floor((qty - q) / q))
  if (redos >= 2) {
    return {
      remaining,
      band: t('pieces.redo.safe', { count: redos }),
      bandClass: 'text-green-700',
    }
  }
  if (redos === 1) {
    return {
      remaining,
      band: t('pieces.redo.tight'),
      bandClass: 'text-amber-700',
    }
  }
  return {
    remaining,
    band: t('pieces.redo.risky'),
    bandClass: 'text-red-600',
  }
}

function pieceComparable(
  piece: Piece,
  key: string,
  ctx: {
    jobLabel: string
    statusLabel: string
    pieceItems: PieceItem[]
    inventory: Inventory[]
    lots: Lot[]
  },
): string | number {
  switch (key) {
    case 'id':
      return piece.id.toLowerCase()
    case 'job':
      return ctx.jobLabel.toLowerCase()
    case 'name':
      return piece.name.toLowerCase()
    case 'status':
      return piece.status
    case 'created_at':
      return piece.created_at
    case 'price': {
      const p = piece.price
      if (typeof p !== 'number' || Number.isNaN(p)) return Number.POSITIVE_INFINITY
      return p
    }
    case 'units': {
      const u = piece.units
      if (typeof u !== 'number' || Number.isNaN(u)) return Number.POSITIVE_INFINITY
      return u
    }
    case 'line_total': {
      const u = pieceUnitsResolved(piece)
      const p = piece.price
      if (u == null || typeof p !== 'number' || !Number.isFinite(p)) {
        return Number.POSITIVE_INFINITY
      }
      return u * p
    }
    case 'benefit': {
      const u = pieceUnitsResolved(piece)
      if (u == null || !piecePriceIsSet(piece)) return Number.POSITIVE_INFINITY
      const sug = computePieceSuggestedPrice(
        piece.id,
        ctx.pieceItems,
        ctx.inventory,
        ctx.lots,
      )
      if (sug.kind !== 'ok') return Number.POSITIVE_INFINITY
      return u * (piece.price as number) - sug.materialSubtotal * u
    }
    case 'run_margin':
      return 0
    default:
      return ''
  }
}

interface PiecesTableProps {
  pieces: Piece[]
  jobs: Job[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  lots: Lot[]
  spreadsheetId: string | null
  expandedPieceId: string | null
  onToggleExpand: (pieceId: string) => void
  onOpenAddLine: (pieceId: string) => void
  onStatusChange: (piece: Piece, nextStatus: Piece['status']) => void
  onPiecePriceCommit: (pieceId: string, raw: string) => Promise<void>
  onPieceUnitsCommit: (pieceId: string, raw: string) => Promise<void>
  statusUpdatingId?: string | null
  hideJobColumn?: boolean
}

export function PiecesTable({
  pieces,
  jobs,
  pieceItems,
  inventory,
  lots,
  spreadsheetId,
  expandedPieceId,
  onToggleExpand,
  onOpenAddLine,
  onStatusChange,
  onPiecePriceCommit,
  onPieceUnitsCommit,
  statusUpdatingId = null,
  hideJobColumn = false,
}: PiecesTableProps) {
  const { t } = useTranslation()
  const colCount = hideJobColumn ? 10 : 11

  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const linesByPiece = useMemo(() => {
    const map = new Map<string, PieceItem[]>()
    for (const item of pieceItems) {
      const list = map.get(item.piece_id) ?? []
      list.push(item)
      map.set(item.piece_id, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.id.localeCompare(b.id))
    }
    return map
  }, [pieceItems])

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(pieces, query, (piece) =>
        buildPieceSearchBlob(piece, {
          jobLabel: jobLabel(jobs, piece.job_id),
          statusLabel: t(`pieces.status.${piece.status}`),
        })
      ),
    [pieces, query, jobs, t]
  )

  const displayed = useMemo(() => {
    if (sortKey === null) {
      return filtered
    }
    return sortRowsByColumn(
      filtered,
      (p) => p.id,
      sortKey,
      sortDir,
      (piece, key) =>
        pieceComparable(piece, key, {
          jobLabel: jobLabel(jobs, piece.job_id),
          statusLabel: t(`pieces.status.${piece.status}`),
          pieceItems,
          inventory,
          lots,
        })
    )
  }, [filtered, sortKey, sortDir, jobs, t, pieceItems, inventory, lots])

  useEffect(() => {
    if (!expandedPieceId) return
    if (!displayed.some((p) => p.id === expandedPieceId)) {
      onToggleExpand(expandedPieceId)
    }
  }, [displayed, expandedPieceId, onToggleExpand])

  const onSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortAria = (columnLabel: string, key: string) => {
    const active = sortKey === key
    if (!active) {
      return t('listTable.sortBy', { column: columnLabel })
    }
    return sortDir === 'asc'
      ? t('listTable.sortedAscending', { column: columnLabel })
      : t('listTable.sortedDescending', { column: columnLabel })
  }

  return (
    <div>
      <ListTableSearchField
        value={query}
        onChange={setQuery}
        placeholder={t('listTable.searchPlaceholder')}
        ariaLabel={t('listTable.searchAria')}
      />
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600"
                aria-label={t('pieces.colExpand')}
              >
                <span className="sr-only">{t('pieces.colExpand')}</span>
              </th>
              <SortableColumnHeader
                columnKey="id"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('pieces.colId'), 'id')}
              >
                {t('pieces.colId')}
              </SortableColumnHeader>
              {!hideJobColumn ? (
                <SortableColumnHeader
                  columnKey="job"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortChange={onSortChange}
                  thClassName="hidden md:table-cell"
                  ariaLabel={sortAria(t('pieces.colJob'), 'job')}
                >
                  {t('pieces.colJob')}
                </SortableColumnHeader>
              ) : null}
              <SortableColumnHeader
                columnKey="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden sm:table-cell"
                ariaLabel={sortAria(t('pieces.colName'), 'name')}
              >
                {t('pieces.colName')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="units"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden sm:table-cell"
                ariaLabel={sortAria(t('pieces.colUnits'), 'units')}
              >
                {t('pieces.colUnits')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="price"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('pieces.colPricePerUnit'), 'price')}
              >
                {t('pieces.colPricePerUnit')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="line_total"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('pieces.colLineTotal'), 'line_total')}
              >
                {t('pieces.colLineTotal')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="benefit"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('pieces.colBenefit'), 'benefit')}
              >
                {t('pieces.colBenefit')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="run_margin"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('pieces.colRunMargin'), 'run_margin')}
              >
                {t('pieces.colRunMargin')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('pieces.colStatus'), 'status')}
              >
                {t('pieces.colStatus')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('pieces.colCreated'), 'created_at')}
              >
                {t('pieces.colCreated')}
              </SortableColumnHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-6 text-center text-sm text-gray-600"
                >
                  {pieces.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((piece) => {
                const expanded = expandedPieceId === piece.id
                const lines = linesByPiece.get(piece.id) ?? []
                return (
                  <Fragment key={piece.id}>
                    <tr
                      id={`piece-${piece.id}`}
                      className={`odd:bg-white even:bg-gray-50 hover:bg-gray-100 ${
                        pieceUnitsAreSet(piece)
                          ? ''
                          : 'bg-amber-50/70 ring-1 ring-inset ring-amber-200'
                      }`}
                    >
                      <td className="whitespace-nowrap px-2 py-3">
                        <button
                          type="button"
                          data-testid={`expand-piece-${piece.id}`}
                          aria-expanded={expanded}
                          aria-controls={`piece-items-${piece.id}`}
                          onClick={() => onToggleExpand(piece.id)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-200"
                        >
                          {expanded ? '\u25BC' : '\u25B6'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {piece.id}
                      </td>
                      {!hideJobColumn ? (
                        <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 md:table-cell">
                          {jobLabel(jobs, piece.job_id)}
                        </td>
                      ) : null}
                      <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 sm:table-cell">
                        {piece.name}
                      </td>
                      <td className="hidden px-2 py-3 text-sm sm:table-cell">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          data-testid={`piece-units-${piece.id}`}
                          key={`${piece.id}-u-${piece.units ?? 'x'}`}
                          defaultValue={
                            piece.units === undefined
                              ? ''
                              : String(piece.units)
                          }
                          disabled={!spreadsheetId}
                          onBlur={(e) => {
                            void onPieceUnitsCommit(piece.id, e.target.value)
                          }}
                          className="w-16 rounded border border-gray-300 px-2 py-1 text-right text-gray-800 disabled:bg-gray-100"
                          aria-label={t('pieces.colUnits')}
                        />
                      </td>
                      <td className="hidden px-2 py-3 text-sm md:table-cell">
                        <div className="flex flex-col items-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            data-testid={`piece-price-${piece.id}`}
                            key={`${piece.id}-${piece.price ?? 'u'}`}
                            defaultValue={
                              piece.price === undefined
                                ? ''
                                : String(piece.price)
                            }
                            disabled={!spreadsheetId}
                            onBlur={(e) => {
                              void onPiecePriceCommit(piece.id, e.target.value)
                            }}
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-gray-800 disabled:bg-gray-100"
                            aria-label={t('pieces.colPricePerUnit')}
                          />
                          {(() => {
                            const sug = computePieceSuggestedPrice(
                              piece.id,
                              pieceItems,
                              inventory,
                              lots,
                            )
                            if (sug.kind !== 'ok') return null
                            return (
                              <button
                                type="button"
                                data-testid={`piece-suggested-${piece.id}`}
                                className="text-xs font-medium text-blue-700 hover:text-blue-900"
                                onClick={() => {
                                  const rounded = Number(
                                    sug.suggestedPrice.toFixed(2)
                                  )
                                  void onPiecePriceCommit(
                                    piece.id,
                                    String(rounded)
                                  )
                                }}
                              >
                                {t('pieces.suggestedApplyPerUnit', {
                                  price: formatCurrency(sug.suggestedPrice),
                                })}
                              </button>
                            )
                          })()}
                        </div>
                      </td>
                      <td className="hidden px-2 py-3 text-right text-sm text-gray-800 md:table-cell">
                        {(() => {
                          const u = pieceUnitsResolved(piece)
                          const p = piece.price
                          if (
                            u == null ||
                            typeof p !== 'number' ||
                            !Number.isFinite(p)
                          ) {
                            return '—'
                          }
                          return formatCurrency(u * p)
                        })()}
                      </td>
                      <td className="hidden px-2 py-3 text-right text-sm text-gray-800 lg:table-cell">
                        {(() => {
                          const u = pieceUnitsResolved(piece)
                          if (u == null || !piecePriceIsSet(piece)) return '—'
                          const sug = computePieceSuggestedPrice(
                            piece.id,
                            pieceItems,
                            inventory,
                            lots,
                          )
                          if (sug.kind !== 'ok') return '—'
                          const revenue = u * (piece.price as number)
                          const material = sug.materialSubtotal * u
                          return formatCurrency(revenue - material)
                        })()}
                      </td>
                      <td className="hidden max-w-xs px-2 py-3 text-xs text-gray-700 lg:table-cell">
                        {(() => {
                          const u = pieceUnitsResolved(piece)
                          if (u == null || lines.length === 0) return '—'
                          return (
                            <div className="flex flex-col gap-1">
                              {lines.map((line) => {
                                const inv = inventory.find(
                                  (x) => x.id === line.inventory_id,
                                )
                                const { remaining, band, bandClass } =
                                  redoDisplay(t, inv, line.quantity * u)
                                return (
                                  <div key={line.id}>
                                    <span className="font-medium text-gray-600">
                                      {inv?.name ?? line.inventory_id}:
                                    </span>{' '}
                                    {band ? (
                                      <span className={bandClass}>{band}</span>
                                    ) : (
                                      <span>{remaining}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        <PieceStatusDropdown
                          pieceId={piece.id}
                          status={piece.status}
                          disabled={statusUpdatingId === piece.id}
                          onChange={(next) => onStatusChange(piece, next)}
                        />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 lg:table-cell">
                        {piece.created_at}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${piece.id}-detail`} className="bg-gray-50">
                        <td colSpan={colCount} className="px-4 py-3">
                          <div
                            id={`piece-items-${piece.id}`}
                            className="rounded-lg border border-gray-200 bg-white p-4"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-800">
                                {t('pieces.linesHeading')}
                              </h4>
                              <button
                                type="button"
                                data-testid={`add-line-${piece.id}`}
                                onClick={() => onOpenAddLine(piece.id)}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                {t('pieces.addLine')}
                              </button>
                            </div>
                            {lines.length === 0 ? (
                              <p className="text-sm text-gray-600">
                                {t('pieces.noLines')}
                              </p>
                            ) : (
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-600">
                                    <th className="py-2 pr-4">
                                      {t('pieces.lineColId')}
                                    </th>
                                    <th className="py-2 pr-4">
                                      {t('pieces.lineColInventory')}
                                    </th>
                                    <th className="py-2 pr-4">
                                      {t('pieces.lineColQty')}
                                    </th>
                                    <th className="py-2 pr-4 text-right">
                                      {t('pieces.lineColMaterialCost')}
                                    </th>
                                    <th className="py-2">
                                      {t('pieces.lineColStock')}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lines.map((line) => (
                                    <tr
                                      key={line.id}
                                      className="border-b border-gray-100"
                                    >
                                      <td className="py-2 pr-4 text-gray-800">
                                        {line.id}
                                      </td>
                                      <td className="py-2 pr-4 text-gray-800">
                                        {inventoryLabel(
                                          inventory,
                                          line.inventory_id
                                        )}
                                      </td>
                                      <td className="py-2 pr-4 text-gray-800">
                                        {line.quantity}
                                      </td>
                                      <td className="py-2 pr-4 text-right text-gray-800">
                                        {(() => {
                                          const cost = materialCostForPieceItemLine(
                                            line,
                                            inventory,
                                            lots,
                                          )
                                          return cost == null
                                            ? '—'
                                            : formatCurrency(cost)
                                        })()}
                                      </td>
                                      <td className="py-2 text-gray-800">
                                        {(() => {
                                          const inv = inventory.find(
                                            (x) => x.id === line.inventory_id
                                          )
                                          const { remaining, band, bandClass } =
                                            redoDisplay(t, inv, line.quantity)
                                          return band ? (
                                            <span>
                                              <span>{remaining}</span>
                                              <span
                                                className={`ml-1 ${bandClass}`}
                                              >
                                                · {band}
                                              </span>
                                            </span>
                                          ) : (
                                            <span>{remaining}</span>
                                          )
                                        })()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
