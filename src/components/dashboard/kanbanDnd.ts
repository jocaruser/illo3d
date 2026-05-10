import type { DragEvent } from 'react'

/** MIME type for HTML5 drag-and-drop of piece cards between kanban columns. */
export const KANBAN_PIECE_DRAG_MIME = 'application/x-illo3d-piece-id'

let activeKanbanPieceDragId: string | null = null

/** Call from drag handle onDragStart (some browsers omit custom MIME in dragOver types). */
export function beginKanbanPieceDrag(pieceId: string): void {
  activeKanbanPieceDragId = pieceId
}

export function endKanbanPieceDrag(): void {
  activeKanbanPieceDragId = null
}

export function getKanbanPieceDragId(): string | null {
  return activeKanbanPieceDragId
}

export function isKanbanPieceDragActive(): boolean {
  return activeKanbanPieceDragId !== null
}

function mimeTypeMatchesPieceDrag(types: readonly string[]): boolean {
  for (const raw of types) {
    const t = raw.toLowerCase()
    if (t === KANBAN_PIECE_DRAG_MIME.toLowerCase()) return true
    if (t.includes('illo3d-piece')) return true
  }
  return false
}

/** Whether this drag event is (likely) our kanban piece drag. */
export function isKanbanPieceDragEvent(e: DragEvent<HTMLElement>): boolean {
  if (isKanbanPieceDragActive()) return true
  return mimeTypeMatchesPieceDrag(e.dataTransfer.types)
}

// Legacy exports for backward compatibility
export const KANBAN_JOB_DRAG_MIME = 'application/x-illo3d-job-id'
export const beginKanbanJobDrag = beginKanbanPieceDrag
export const endKanbanJobDrag = endKanbanPieceDrag
export const getKanbanJobDragId = getKanbanPieceDragId
export const isKanbanJobDragActive = isKanbanPieceDragActive
export const isKanbanJobDragEvent = isKanbanPieceDragEvent
