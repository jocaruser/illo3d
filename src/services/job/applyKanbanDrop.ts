import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { Job, JobStatus } from '@/types/money'
import { compareJobsForKanban } from '@/utils/kanbanJobSort'
import { jobToJobsSheetRow } from '@/services/job/jobsSheetRow'
import { updateJobStatus } from '@/services/job/updateJobStatus'

export function kanbanStatusChangeNeedsDialog(job: Job, next: JobStatus): boolean {
  if (next === job.status) return false
  if (next === 'paid') return true
  if (job.status === 'paid') return true
  if (next === 'cancelled') return true
  return false
}

function sortedInStatus(jobs: Job[], status: JobStatus): Job[] {
  return jobs.filter((j) => j.status === status).sort(compareJobsForKanban)
}

function resolveInsertIndex(
  orderedSansMoved: Job[],
  insertBeforeId: string | null,
): number {
  if (insertBeforeId == null) return orderedSansMoved.length
  const idx = orderedSansMoved.findIndex((j) => j.id === insertBeforeId)
  return idx < 0 ? orderedSansMoved.length : idx
}

function applyBoardOrderPatchesForColumns(orderedColumns: Job[][]): void {
  patchWorkbookTab('jobs', (m) => {
    let out = m
    for (const ordered of orderedColumns) {
      ordered.forEach((j, i) => {
        const ord = (i + 1) * 1000
        const cur = matrixToJobs(out).find((x) => x.id === j.id)
        if (!cur) return
        if (boardOrderEquals(cur.board_order, ord)) return
        out = updateDataRowById(
          'jobs',
          out,
          j.id,
          jobToJobsSheetRow({ ...cur, board_order: ord }),
        )
      })
    }
    return out
  })
}

function boardOrderEquals(
  current: number | undefined,
  next: number,
): boolean {
  const c =
    current === undefined || current === null || Number.isNaN(Number(current))
      ? 0
      : Number(current)
  return c === next
}

/** Applies column board_order after a move/reorder. Pass current workbook jobs snapshot. */
export function patchKanbanBoardOrdersAfterDrop(
  jobs: Job[],
  fromStatus: JobStatus,
  toStatus: JobStatus,
  movedId: string,
  insertBeforeId: string | null,
): void {
  const moved = jobs.find((j) => j.id === movedId)
  if (!moved) return
  if (insertBeforeId === movedId) return

  if (fromStatus === toStatus) {
    const column = sortedInStatus(jobs, fromStatus)
    const sans = column.filter((j) => j.id !== movedId)
    const insertAt = resolveInsertIndex(sans, insertBeforeId)
    const newOrder = [...sans.slice(0, insertAt), moved, ...sans.slice(insertAt)]
    applyBoardOrderPatchesForColumns([newOrder])
    return
  }

  const sourceSans = sortedInStatus(jobs, fromStatus)
  const targetSans = sortedInStatus(
    jobs.filter((j) => j.status === toStatus && j.id !== movedId),
    toStatus,
  )
  const insertAt = resolveInsertIndex(targetSans, insertBeforeId)
  const newTarget = [
    ...targetSans.slice(0, insertAt),
    moved,
    ...targetSans.slice(insertAt),
  ]
  applyBoardOrderPatchesForColumns([sourceSans, newTarget])
}

/** Call after status commit from a dialog when `applyKanbanDrop` returned `needs-dialog`. */
export function applyKanbanBoardOrderAfterStatusCommit(
  fromStatus: JobStatus,
  targetStatus: JobStatus,
  jobId: string,
  insertBeforeId: string | null,
): void {
  const fresh = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  patchKanbanBoardOrdersAfterDrop(
    fresh,
    fromStatus,
    targetStatus,
    jobId,
    insertBeforeId,
  )
}

export async function applyKanbanDrop(
  spreadsheetId: string,
  draggedId: string,
  targetStatus: JobStatus,
  insertBeforeId: string | null,
): Promise<'ok' | 'needs-dialog'> {
  const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  const job = jobs.find((j) => j.id === draggedId)
  if (!job || job.archived === 'true' || job.deleted === 'true') return 'ok'

  if (job.status === targetStatus) {
    patchKanbanBoardOrdersAfterDrop(
      jobs,
      targetStatus,
      targetStatus,
      draggedId,
      insertBeforeId,
    )
    return 'ok'
  }

  if (kanbanStatusChangeNeedsDialog(job, targetStatus)) {
    return 'needs-dialog'
  }

  const fromStatus = job.status
  await updateJobStatus(spreadsheetId, job, targetStatus)
  const fresh = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  patchKanbanBoardOrdersAfterDrop(
    fresh,
    fromStatus,
    targetStatus,
    draggedId,
    insertBeforeId,
  )
  return 'ok'
}
