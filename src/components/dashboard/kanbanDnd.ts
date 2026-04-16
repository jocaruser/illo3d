import type { DragEvent } from 'react'

/** MIME type for HTML5 drag-and-drop of job cards between kanban columns. */
export const KANBAN_JOB_DRAG_MIME = 'application/x-illo3d-job-id'

let activeKanbanJobDragId: string | null = null

/** Call from drag handle onDragStart (some browsers omit custom MIME in dragOver types). */
export function beginKanbanJobDrag(jobId: string): void {
  activeKanbanJobDragId = jobId
}

export function endKanbanJobDrag(): void {
  activeKanbanJobDragId = null
}

export function getKanbanJobDragId(): string | null {
  return activeKanbanJobDragId
}

export function isKanbanJobDragActive(): boolean {
  return activeKanbanJobDragId !== null
}

function mimeTypeMatchesJobDrag(types: readonly string[]): boolean {
  for (const raw of types) {
    const t = raw.toLowerCase()
    if (t === KANBAN_JOB_DRAG_MIME.toLowerCase()) return true
    if (t.includes('illo3d-job')) return true
  }
  return false
}

/** Whether this drag event is (likely) our kanban job drag. */
export function isKanbanJobDragEvent(e: DragEvent<HTMLElement>): boolean {
  if (isKanbanJobDragActive()) return true
  return mimeTypeMatchesJobDrag(e.dataTransfer.types)
}
