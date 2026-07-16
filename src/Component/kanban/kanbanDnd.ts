import type { JobStatus } from '@/Entity/Job'

/** Private MIME type so the board never reacts to unrelated dragged text. */
export const KANBAN_MIME = 'application/x-illo3d-job-id'

/** Where a dropped card should land: a column, and the card to sit before. */
export interface KanbanDropTarget {
  status: JobStatus
  /** Undefined appends to the end of the column. */
  insertBeforeJobId?: string
}

export function setDragJobId(dataTransfer: DataTransfer, jobId: string): void {
  dataTransfer.effectAllowed = 'move'
  dataTransfer.setData(KANBAN_MIME, jobId)
  // Plain text keeps the drag legible to the rest of the platform.
  dataTransfer.setData('text/plain', jobId)
}

/** The dragged job id, or null when the drag did not start on a card. */
export function getDragJobId(dataTransfer: DataTransfer | null): string | null {
  if (!dataTransfer) return null
  const jobId = dataTransfer.getData(KANBAN_MIME)
  return jobId === '' ? null : jobId
}
