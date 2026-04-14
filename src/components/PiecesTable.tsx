import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Inventory, Job, Piece, PieceItem, PieceStatus } from '@/types/money'

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

interface PiecesTableProps {
  pieces: Piece[]
  jobs: Job[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  expandedPieceId: string | null
  onToggleExpand: (pieceId: string) => void
  onOpenAddLine: (pieceId: string) => void
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
  hideJobColumn = false,
}: PiecesTableProps) {
  const { t } = useTranslation()
  const colCount = hideJobColumn ? 5 : 6

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

  const statusLabel = (s: PieceStatus) => t(`pieces.status.${s}`)

  return (
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
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('pieces.colId')}
            </th>
            {!hideJobColumn ? (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                {t('pieces.colJob')}
              </th>
            ) : null}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('pieces.colName')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('pieces.colStatus')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('pieces.colCreated')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {pieces.map((piece) => {
            const expanded = expandedPieceId === piece.id
            const lines = linesByPiece.get(piece.id) ?? []
            return (
              <Fragment key={piece.id}>
                <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
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
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                      {jobLabel(jobs, piece.job_id)}
                    </td>
                  ) : null}
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                    {piece.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {statusLabel(piece.status)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
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
                                <th className="py-2">{t('pieces.lineColQty')}</th>
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
                                    {inventoryLabel(inventory, line.inventory_id)}
                                  </td>
                                  <td className="py-2 text-gray-800">
                                    {line.quantity}
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
          })}
        </tbody>
      </table>
    </div>
  )
}
