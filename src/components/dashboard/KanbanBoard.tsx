import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Job, Piece } from '@/types/money'
import type { KanbanColumn as KanbanColumnType } from '@/types/shop'
import { KanbanColumn } from './KanbanColumn'
import { endKanbanJobDrag } from './kanbanDnd'
import { isActiveRow } from '@/lib/entityFilters'

interface KanbanBoardProps {
  columns: KanbanColumnType[]
  jobs: Job[]
  pieces: Piece[]
  clientsById: Map<string, string>
  onPieceMove: (pieceId: string, newStatus: string, insertBeforeId?: string | null) => void
  updatingPieceId: string | null
}

export function KanbanBoard({
  columns,
  jobs,
  pieces,
  clientsById,
  onPieceMove,
  updatingPieceId,
}: KanbanBoardProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const clear = () => endKanbanJobDrag()
    document.addEventListener('dragend', clear, true)
    return () => document.removeEventListener('dragend', clear, true)
  }, [])

  // Create job lookup map for enrichment
  const jobMap = useMemo(() => {
    const map = new Map<string, Job>()
    for (const job of jobs) {
      if (isActiveRow(job)) {
        map.set(job.id, job)
      }
    }
    return map
  }, [jobs])

  // Group pieces by status
  const piecesByColumn = useMemo(() => {
    const map = new Map<string, Piece[]>()
    
    // Initialize all columns with empty arrays
    for (const col of columns) {
      map.set(col.name, [])
    }
    
    // Assign pieces to columns
    for (const piece of pieces) {
      if (!isActiveRow(piece)) continue
      
      const status = piece.status || (columns[0]?.name ?? '')
      const columnPieces = map.get(status)
      if (columnPieces) {
        columnPieces.push(piece)
      } else if (columns.length > 0) {
        // If piece has unknown status, put in first column
        map.get(columns[0]!.name)?.push(piece)
      }
    }
    
    // Sort pieces within each column by board_order, then created_at
    for (const columnPieces of map.values()) {
      columnPieces.sort((a, b) => {
        const orderA = a.board_order ?? Infinity
        const orderB = b.board_order ?? Infinity
        if (orderA !== orderB) return orderA - orderB
        return b.created_at.localeCompare(a.created_at)
      })
    }
    
    return map
  }, [pieces, columns])

  if (columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">{t('kanban.noColumnsConfigured')}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2 h-full">
      <div className="flex min-w-min items-stretch gap-3 h-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column.name}
            column={column}
            pieces={piecesByColumn.get(column.name) ?? []}
            jobs={jobMap}
            clientsById={clientsById}
            onDropPiece={onPieceMove}
            updatingPieceId={updatingPieceId}
          />
        ))}
      </div>
    </div>
  )
}
