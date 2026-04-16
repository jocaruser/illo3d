import type { SheetName } from '@/services/sheets/config'
import {
  cloneMatrix,
  ensureMatrix,
  findDataRowIndexById,
  headerIndex,
} from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { useWorkbookStore } from '@/stores/workbookStore'

function setLifecycleField(
  matrix: string[][],
  rowIdx: number,
  sheetName: SheetName,
  field: 'archived' | 'deleted',
  value: string
): string[][] {
  const m = cloneMatrix(matrix)
  const col = headerIndex(sheetName, field)
  const width = m[0].length
  const row = [...m[rowIdx]]
  while (row.length < width) row.push('')
  row[col] = value
  m[rowIdx] = row
  return m
}

export function unArchiveEntity(
  sheetName: SheetName,
  rowId: string
): void {
  patchWorkbookTab(sheetName, (m) => {
    const i = findDataRowIndexById(m, sheetName, rowId)
    if (i === -1) throw new Error(`${sheetName} row ${rowId} not found`)
    return setLifecycleField(m, i, sheetName, 'archived', '')
  })
}

export function softDeleteEntity(
  sheetName: SheetName,
  rowId: string
): void {
  patchWorkbookTab(sheetName, (m) => {
    const i = findDataRowIndexById(m, sheetName, rowId)
    if (i === -1) throw new Error(`${sheetName} row ${rowId} not found`)
    return setLifecycleField(m, i, sheetName, 'deleted', 'true')
  })
}

function archiveCrmNotesForEntity(entityType: string, entityId: string): void {
  const tabs = useWorkbookStore.getState().tabs
  let m = ensureMatrix(tabs, 'crm_notes')
  const et = headerIndex('crm_notes', 'entity_type')
  const eid = headerIndex('crm_notes', 'entity_id')
  m = cloneMatrix(m)
  for (let i = 1; i < m.length; i++) {
    if (
      (m[i][et] ?? '').trim() === entityType.trim() &&
      (m[i][eid] ?? '').trim() === entityId.trim()
    ) {
      m = setLifecycleField(m, i, 'crm_notes', 'archived', 'true')
    }
  }
  useWorkbookStore.getState().mutateTab('crm_notes', m)
}

function archiveTagLinks(entityType: string, entityId: string): void {
  const tabs = useWorkbookStore.getState().tabs
  let m = ensureMatrix(tabs, 'tag_links')
  const et = headerIndex('tag_links', 'entity_type')
  const eid = headerIndex('tag_links', 'entity_id')
  m = cloneMatrix(m)
  for (let i = 1; i < m.length; i++) {
    if (
      (m[i][et] ?? '').trim() === entityType.trim() &&
      (m[i][eid] ?? '').trim() === entityId.trim()
    ) {
      m = setLifecycleField(m, i, 'tag_links', 'archived', 'true')
    }
  }
  useWorkbookStore.getState().mutateTab('tag_links', m)
}

function softDeleteCrmNotesForEntity(entityType: string, entityId: string): void {
  const tabs = useWorkbookStore.getState().tabs
  let m = ensureMatrix(tabs, 'crm_notes')
  const et = headerIndex('crm_notes', 'entity_type')
  const eid = headerIndex('crm_notes', 'entity_id')
  m = cloneMatrix(m)
  for (let i = 1; i < m.length; i++) {
    if (
      (m[i][et] ?? '').trim() === entityType.trim() &&
      (m[i][eid] ?? '').trim() === entityId.trim()
    ) {
      m = setLifecycleField(m, i, 'crm_notes', 'deleted', 'true')
    }
  }
  useWorkbookStore.getState().mutateTab('crm_notes', m)
}

function softDeleteTagLinks(entityType: string, entityId: string): void {
  const tabs = useWorkbookStore.getState().tabs
  let m = ensureMatrix(tabs, 'tag_links')
  const et = headerIndex('tag_links', 'entity_type')
  const eid = headerIndex('tag_links', 'entity_id')
  m = cloneMatrix(m)
  for (let i = 1; i < m.length; i++) {
    if (
      (m[i][et] ?? '').trim() === entityType.trim() &&
      (m[i][eid] ?? '').trim() === entityId.trim()
    ) {
      m = setLifecycleField(m, i, 'tag_links', 'deleted', 'true')
    }
  }
  useWorkbookStore.getState().mutateTab('tag_links', m)
}

/** Archive a job and cascade to pieces, piece_items, notes, tag links. */
export function archiveJob(jobId: string): void {
  patchWorkbookTab('jobs', (m) => {
    const i = findDataRowIndexById(m, 'jobs', jobId)
    if (i === -1) throw new Error(`Job ${jobId} not found`)
    return setLifecycleField(m, i, 'jobs', 'archived', 'true')
  })

  const tabs = useWorkbookStore.getState().tabs
  let pieces = ensureMatrix(tabs, 'pieces')
  const pj = headerIndex('pieces', 'job_id')
  const pid = headerIndex('pieces', 'id')
  pieces = cloneMatrix(pieces)
  const pieceIds: string[] = []
  for (let i = 1; i < pieces.length; i++) {
    if ((pieces[i][pj] ?? '').trim() === jobId.trim()) {
      pieces = setLifecycleField(pieces, i, 'pieces', 'archived', 'true')
      const p = (pieces[i][pid] ?? '').trim()
      if (p) pieceIds.push(p)
    }
  }
  useWorkbookStore.getState().mutateTab('pieces', pieces)

  let pieceItems = ensureMatrix(useWorkbookStore.getState().tabs, 'piece_items')
  const pp = headerIndex('piece_items', 'piece_id')
  pieceItems = cloneMatrix(pieceItems)
  for (let i = 1; i < pieceItems.length; i++) {
    if (pieceIds.includes((pieceItems[i][pp] ?? '').trim())) {
      pieceItems = setLifecycleField(pieceItems, i, 'piece_items', 'archived', 'true')
    }
  }
  useWorkbookStore.getState().mutateTab('piece_items', pieceItems)

  archiveCrmNotesForEntity('job', jobId)
  archiveTagLinks('job', jobId)
}

/** Archive client and cascade jobs (and their subtrees) plus client-scoped notes/links. */
export function archiveClient(clientId: string): void {
  patchWorkbookTab('clients', (m) => {
    const i = findDataRowIndexById(m, 'clients', clientId)
    if (i === -1) throw new Error(`Client ${clientId} not found`)
    return setLifecycleField(m, i, 'clients', 'archived', 'true')
  })

  archiveCrmNotesForEntity('client', clientId)
  archiveTagLinks('client', clientId)

  const tabs = useWorkbookStore.getState().tabs
  const jobs = ensureMatrix(tabs, 'jobs')
  const jc = headerIndex('jobs', 'client_id')
  const jid = headerIndex('jobs', 'id')
  const jobIds: string[] = []
  for (let i = 1; i < jobs.length; i++) {
    if ((jobs[i][jc] ?? '').trim() === clientId.trim()) {
      const j = (jobs[i][jid] ?? '').trim()
      if (j) jobIds.push(j)
    }
  }
  for (const j of jobIds) {
    archiveJob(j)
  }
}

export function softDeleteClient(clientId: string): void {
  patchWorkbookTab('clients', (m) => {
    const i = findDataRowIndexById(m, 'clients', clientId)
    if (i === -1) throw new Error(`Client ${clientId} not found`)
    return setLifecycleField(m, i, 'clients', 'deleted', 'true')
  })

  softDeleteCrmNotesForEntity('client', clientId)
  softDeleteTagLinks('client', clientId)

  const tabs = useWorkbookStore.getState().tabs
  const jobs = ensureMatrix(tabs, 'jobs')
  const jc = headerIndex('jobs', 'client_id')
  const jid = headerIndex('jobs', 'id')
  const jobIds: string[] = []
  for (let i = 1; i < jobs.length; i++) {
    if ((jobs[i][jc] ?? '').trim() === clientId.trim()) {
      const j = (jobs[i][jid] ?? '').trim()
      if (j) jobIds.push(j)
    }
  }
  for (const j of jobIds) {
    softDeleteJob(j)
  }
}

export function softDeleteJob(jobId: string): void {
  patchWorkbookTab('jobs', (m) => {
    const i = findDataRowIndexById(m, 'jobs', jobId)
    if (i === -1) throw new Error(`Job ${jobId} not found`)
    return setLifecycleField(m, i, 'jobs', 'deleted', 'true')
  })

  const tabs = useWorkbookStore.getState().tabs
  let pieces = ensureMatrix(tabs, 'pieces')
  const pj = headerIndex('pieces', 'job_id')
  const pid = headerIndex('pieces', 'id')
  pieces = cloneMatrix(pieces)
  const pieceIds: string[] = []
  for (let i = 1; i < pieces.length; i++) {
    if ((pieces[i][pj] ?? '').trim() === jobId.trim()) {
      pieces = setLifecycleField(pieces, i, 'pieces', 'deleted', 'true')
      const p = (pieces[i][pid] ?? '').trim()
      if (p) pieceIds.push(p)
    }
  }
  useWorkbookStore.getState().mutateTab('pieces', pieces)

  let pieceItems = ensureMatrix(useWorkbookStore.getState().tabs, 'piece_items')
  const pp = headerIndex('piece_items', 'piece_id')
  pieceItems = cloneMatrix(pieceItems)
  for (let i = 1; i < pieceItems.length; i++) {
    if (pieceIds.includes((pieceItems[i][pp] ?? '').trim())) {
      pieceItems = setLifecycleField(pieceItems, i, 'piece_items', 'deleted', 'true')
    }
  }
  useWorkbookStore.getState().mutateTab('piece_items', pieceItems)

  softDeleteCrmNotesForEntity('job', jobId)
  softDeleteTagLinks('job', jobId)
}
