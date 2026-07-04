import type { SheetName } from '@/services/sheets/config'
import type { AuditEntityName } from '@/types/money'
import {
  cloneMatrix,
  ensureMatrix,
  findDataRowIndexById,
  headerIndex,
} from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  auditArchive,
  auditSoftDelete,
  auditUnarchive,
} from '@/services/audit/auditEventEmitter'
import {
  getCurrentNotesForEntity,
  getCurrentTagLinksForEntity,
} from '@/services/audit/reconstruct'
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

function rowToObject(
  matrix: string[][],
  rowIdx: number
): Record<string, unknown> {
  const headers = matrix[0]
  const row = matrix[rowIdx]
  const obj: Record<string, unknown> = {}
  headers.forEach((h, i) => {
    const v = row[i]
    if (v !== undefined && v !== null && v !== '') {
      obj[h] = v
    }
  })
  return obj
}

function sheetNameToEntityName(sheetName: SheetName): AuditEntityName {
  switch (sheetName) {
    case 'clients':
      return 'client'
    case 'jobs':
      return 'job'
    case 'pieces':
      return 'piece'
    case 'piece_items':
      return 'piece_item'
    case 'inventory':
      return 'inventory'
    case 'lots':
      return 'lot'
    case 'transactions':
      return 'transaction'
    case 'tags':
      return 'tag'
    default:
      throw new Error(`Unsupported sheet name for audit: ${sheetName}`)
  }
}

interface CascadeContext {
  parentEntityName: AuditEntityName
  parentEntityId: string
}

export function unArchiveEntity(
  sheetName: SheetName,
  rowId: string
): void {
  patchWorkbookTab(sheetName, (m) => {
    const i = findDataRowIndexById(m, sheetName, rowId)
    if (i === -1) throw new Error(`${sheetName} row ${rowId} not found`)
    const before = rowToObject(m, i)
    const next = setLifecycleField(m, i, sheetName, 'archived', '')
    const after = rowToObject(next, i)
    auditUnarchive(sheetNameToEntityName(sheetName), rowId, before, after)
    return next
  })
}

export function softDeleteEntity(
  sheetName: SheetName,
  rowId: string,
  context?: CascadeContext
): void {
  patchWorkbookTab(sheetName, (m) => {
    const i = findDataRowIndexById(m, sheetName, rowId)
    if (i === -1) throw new Error(`${sheetName} row ${rowId} not found`)
    const before = rowToObject(m, i)
    const next = setLifecycleField(m, i, sheetName, 'deleted', 'true')
    const after = rowToObject(next, i)
    auditSoftDelete(
      sheetNameToEntityName(sheetName),
      rowId,
      before,
      after,
      context
    )
    return next
  })
}

function archiveEntity(
  sheetName: SheetName,
  rowId: string,
  context?: CascadeContext
): void {
  patchWorkbookTab(sheetName, (m) => {
    const i = findDataRowIndexById(m, sheetName, rowId)
    if (i === -1) throw new Error(`${sheetName} row ${rowId} not found`)
    const before = rowToObject(m, i)
    const next = setLifecycleField(m, i, sheetName, 'archived', 'true')
    const after = rowToObject(next, i)
    auditArchive(
      sheetNameToEntityName(sheetName),
      rowId,
      before,
      after,
      context
    )
    return next
  })
}

function archiveCrmNotesForEntity(
  entityType: 'client' | 'job',
  entityId: string,
  context: CascadeContext
): void {
  const notes = getCurrentNotesForEntity(entityType, entityId)
  for (const note of notes) {
    if (note.archived || note.deleted) continue
    const before = { ...note }
    const after = { ...note, archived: 'true' }
    auditArchive('crm_note', note.id, before, after, context)
  }
}

function archiveTagLinksForEntity(
  entityType: 'client' | 'job',
  entityId: string,
  context: CascadeContext
): void {
  const links = getCurrentTagLinksForEntity(entityType, entityId)
  for (const link of links) {
    if (link.archived || link.deleted) continue
    const before = { ...link }
    const after = { ...link, archived: 'true' }
    auditArchive('tag_link', link.id, before, after, context)
  }
}

function softDeleteCrmNotesForEntity(
  entityType: 'client' | 'job',
  entityId: string,
  context: CascadeContext
): void {
  const notes = getCurrentNotesForEntity(entityType, entityId)
  for (const note of notes) {
    if (note.deleted) continue
    const before = { ...note }
    const after = { ...note, deleted: 'true' }
    auditSoftDelete('crm_note', note.id, before, after, context)
  }
}

function softDeleteTagLinksForEntity(
  entityType: 'client' | 'job',
  entityId: string,
  context: CascadeContext
): void {
  const links = getCurrentTagLinksForEntity(entityType, entityId)
  for (const link of links) {
    if (link.deleted) continue
    const before = { ...link }
    const after = { ...link, deleted: 'true' }
    auditSoftDelete('tag_link', link.id, before, after, context)
  }
}

/** Archive a job and cascade to pieces, piece_items, notes, tag links. */
export function archiveJob(
  jobId: string,
  context?: CascadeContext
): void {
  const jobContext: CascadeContext = context ?? {
    parentEntityName: 'job',
    parentEntityId: jobId,
  }

  archiveEntity('jobs', jobId, context)

  const tabs = useWorkbookStore.getState().tabs
  let pieces = ensureMatrix(tabs, 'pieces')
  const pj = headerIndex('pieces', 'job_id')
  const pid = headerIndex('pieces', 'id')
  pieces = cloneMatrix(pieces)
  const pieceIds: string[] = []
  for (let i = 1; i < pieces.length; i++) {
    if ((pieces[i][pj] ?? '').trim() === jobId.trim()) {
      const before = rowToObject(pieces, i)
      pieces = setLifecycleField(pieces, i, 'pieces', 'archived', 'true')
      const after = rowToObject(pieces, i)
      const pieceId = (pieces[i][pid] ?? '').trim()
      if (pieceId) {
        pieceIds.push(pieceId)
        auditArchive('piece', pieceId, before, after, jobContext)
      }
    }
  }
  useWorkbookStore.getState().mutateTab('pieces', pieces)

  let pieceItems = ensureMatrix(useWorkbookStore.getState().tabs, 'piece_items')
  const pp = headerIndex('piece_items', 'piece_id')
  pieceItems = cloneMatrix(pieceItems)
  for (let i = 1; i < pieceItems.length; i++) {
    const pieceId = (pieceItems[i][pp] ?? '').trim()
    if (pieceIds.includes(pieceId)) {
      const before = rowToObject(pieceItems, i)
      pieceItems = setLifecycleField(pieceItems, i, 'piece_items', 'archived', 'true')
      const itemId = (pieceItems[i][headerIndex('piece_items', 'id')] ?? '').trim()
      if (itemId) {
        auditArchive('piece_item', itemId, before, rowToObject(pieceItems, i), {
          parentEntityName: 'piece',
          parentEntityId: pieceId,
        })
      }
    }
  }
  useWorkbookStore.getState().mutateTab('piece_items', pieceItems)

  archiveCrmNotesForEntity('job', jobId, jobContext)
  archiveTagLinksForEntity('job', jobId, jobContext)
}

/** Archive client and cascade jobs (and their subtrees) plus client-scoped notes/links. */
export function archiveClient(clientId: string): void {
  const clientContext: CascadeContext = {
    parentEntityName: 'client',
    parentEntityId: clientId,
  }

  archiveEntity('clients', clientId)

  archiveCrmNotesForEntity('client', clientId, clientContext)
  archiveTagLinksForEntity('client', clientId, clientContext)

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
    archiveJob(j, clientContext)
  }
}

/** Archive an inventory row and all active lots for that inventory id. */
export function archiveInventory(inventoryId: string): void {
  const inventoryContext: CascadeContext = {
    parentEntityName: 'inventory',
    parentEntityId: inventoryId,
  }

  archiveEntity('inventory', inventoryId)

  const tabs = useWorkbookStore.getState().tabs
  let lotsM = ensureMatrix(tabs, 'lots')
  const invCol = headerIndex('lots', 'inventory_id')
  const archCol = headerIndex('lots', 'archived')
  const delCol = headerIndex('lots', 'deleted')
  lotsM = cloneMatrix(lotsM)
  for (let i = 1; i < lotsM.length; i++) {
    if ((lotsM[i][invCol] ?? '').trim() !== inventoryId.trim()) continue
    const arch = (lotsM[i][archCol] ?? '').trim().toLowerCase() === 'true'
    const del = (lotsM[i][delCol] ?? '').trim().toLowerCase() === 'true'
    if (arch || del) continue
    const before = rowToObject(lotsM, i)
    lotsM = setLifecycleField(lotsM, i, 'lots', 'archived', 'true')
    const after = rowToObject(lotsM, i)
    const lotId = (lotsM[i][headerIndex('lots', 'id')] ?? '').trim()
    if (lotId) {
      auditArchive('lot', lotId, before, after, inventoryContext)
    }
  }
  useWorkbookStore.getState().mutateTab('lots', lotsM)
}

export function softDeleteClient(clientId: string): void {
  const clientContext: CascadeContext = {
    parentEntityName: 'client',
    parentEntityId: clientId,
  }

  softDeleteEntity('clients', clientId)

  softDeleteCrmNotesForEntity('client', clientId, clientContext)
  softDeleteTagLinksForEntity('client', clientId, clientContext)

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
    softDeleteJob(j, clientContext)
  }
}

export function softDeleteJob(
  jobId: string,
  context?: CascadeContext
): void {
  const jobContext: CascadeContext = context ?? {
    parentEntityName: 'job',
    parentEntityId: jobId,
  }

  softDeleteEntity('jobs', jobId, context)

  const tabs = useWorkbookStore.getState().tabs
  let pieces = ensureMatrix(tabs, 'pieces')
  const pj = headerIndex('pieces', 'job_id')
  const pid = headerIndex('pieces', 'id')
  pieces = cloneMatrix(pieces)
  const pieceIds: string[] = []
  for (let i = 1; i < pieces.length; i++) {
    if ((pieces[i][pj] ?? '').trim() === jobId.trim()) {
      const before = rowToObject(pieces, i)
      pieces = setLifecycleField(pieces, i, 'pieces', 'deleted', 'true')
      const after = rowToObject(pieces, i)
      const pieceId = (pieces[i][pid] ?? '').trim()
      if (pieceId) {
        pieceIds.push(pieceId)
        auditSoftDelete('piece', pieceId, before, after, jobContext)
      }
    }
  }
  useWorkbookStore.getState().mutateTab('pieces', pieces)

  let pieceItems = ensureMatrix(useWorkbookStore.getState().tabs, 'piece_items')
  const pp = headerIndex('piece_items', 'piece_id')
  pieceItems = cloneMatrix(pieceItems)
  for (let i = 1; i < pieceItems.length; i++) {
    const pieceId = (pieceItems[i][pp] ?? '').trim()
    if (pieceIds.includes(pieceId)) {
      const before = rowToObject(pieceItems, i)
      pieceItems = setLifecycleField(pieceItems, i, 'piece_items', 'deleted', 'true')
      const itemId = (pieceItems[i][headerIndex('piece_items', 'id')] ?? '').trim()
      if (itemId) {
        auditSoftDelete('piece_item', itemId, before, rowToObject(pieceItems, i), {
          parentEntityName: 'piece',
          parentEntityId: pieceId,
        })
      }
    }
  }
  useWorkbookStore.getState().mutateTab('piece_items', pieceItems)

  softDeleteCrmNotesForEntity('job', jobId, jobContext)
  softDeleteTagLinksForEntity('job', jobId, jobContext)
}
