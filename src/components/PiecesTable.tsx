import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Inventory, Job, Piece, PieceItem } from '@/types/money'
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
  ctx: { jobLabel: string; statusLabel: string }
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
    default:
      return ''
  }
}

interface PiecesTableProps {
  pieces: Piece[]
  jobs: Job[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  expandedPieceId: string | null
  onToggleExpand: (pieceId: string) => void
  onOpenAddLine: (pieceId: string) => void
  onStatusChange: (piece: Piece, nextStatus: Piece['status']) => void
  statusUpdatingId?: string | null
  hideJobColumn?: boolean
}

export function PiecesTable({
  pieces,
  jobs,
  pieceItems,
  inventory,
  expandedPieceId,
  onToggleExpand,
  onOpenAddLine,
  onStatusChange,
  statusUpdatingId = null,
  hideJobColumn = false,
}: PiecesTableProps) {
  const { t } = useTranslation()
  const colCount = hideJobColumn ? 5 : 6

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
        })
    )
  }, [filtered, sortKey, sortDir, jobs, t])

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
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
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
