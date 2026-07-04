import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { useAuthStore } from '@/stores/authStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { AuditAction, AuditEntityName } from '@/types/money'
import { createAuditEntry, auditEntryToRow } from './createAuditEntry'
import { generateAuditId } from './generateAuditId'
import type { AuditSnapshot } from './auditEvent'

function getCurrentActor(): string {
  return useAuthStore.getState().user?.email ?? 'local'
}

function getExistingAuditIds(): string[] {
  const auditLog = useWorkbookStore.getState().tabs.audit_log
  if (!auditLog || auditLog.length < 2) return []
  return auditLog
    .slice(1)
    .map((row) => row[0])
    .filter((id): id is string => id != null && id.trim() !== '')
}

export function getExistingIdsForEntity(
  entityName: AuditEntityName,
  prefix: string
): string[] {
  const auditLog = useWorkbookStore.getState().tabs.audit_log
  if (!auditLog || auditLog.length < 2) return []
  const headers = auditLog[0]
  const entityNameIdx = headers.indexOf('entity_name')
  const entityIdIdx = headers.indexOf('entity_id')
  if (entityNameIdx === -1 || entityIdIdx === -1) return []
  return auditLog
    .slice(1)
    .filter((row) => row[entityNameIdx] === entityName)
    .map((row) => row[entityIdIdx])
    .filter((id): id is string => id != null && id.startsWith(prefix))
}

export interface AuditPayload {
  entityName: AuditEntityName
  entityId: string
  action: AuditAction
  before: object | null
  after: object | null
  parentEntityName?: AuditEntityName | null
  parentEntityId?: string | null
}

function asSnapshot(value: object | null): AuditSnapshot | null {
  if (!value) return null
  return value as AuditSnapshot
}

export function appendAuditEvent(payload: AuditPayload): void {
  const id = generateAuditId(getExistingAuditIds())
  const timestamp = new Date().toISOString()
  const actor = getCurrentActor()
  const entry = createAuditEntry(id, timestamp, actor, {
    entityName: payload.entityName,
    entityId: payload.entityId,
    action: payload.action,
    before: asSnapshot(payload.before),
    after: asSnapshot(payload.after),
    parentEntityName: payload.parentEntityName,
    parentEntityId: payload.parentEntityId,
  })
  const row = auditEntryToRow(entry)

  patchWorkbookTab('audit_log', (matrix) =>
    appendDataRow('audit_log', matrix, row)
  )
}

export function auditCreate(
  entityName: AuditEntityName,
  entityId: string,
  after: object,
  context?: { parentEntityName?: AuditEntityName | null; parentEntityId?: string | null }
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'create',
    before: null,
    after,
    parentEntityName: context?.parentEntityName ?? null,
    parentEntityId: context?.parentEntityId ?? null,
  })
}

export function auditUpdate(
  entityName: AuditEntityName,
  entityId: string,
  before: object,
  after: object,
  context?: { parentEntityName?: AuditEntityName | null; parentEntityId?: string | null }
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'update',
    before,
    after,
    parentEntityName: context?.parentEntityName ?? null,
    parentEntityId: context?.parentEntityId ?? null,
  })
}

export function auditDelete(
  entityName: AuditEntityName,
  entityId: string,
  before: object,
  context?: { parentEntityName?: AuditEntityName | null; parentEntityId?: string | null }
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'delete',
    before,
    after: null,
    parentEntityName: context?.parentEntityName ?? null,
    parentEntityId: context?.parentEntityId ?? null,
  })
}

export function auditArchive(
  entityName: AuditEntityName,
  entityId: string,
  before: object,
  after: object,
  context?: { parentEntityName?: AuditEntityName | null; parentEntityId?: string | null }
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'archive',
    before,
    after,
    parentEntityName: context?.parentEntityName ?? null,
    parentEntityId: context?.parentEntityId ?? null,
  })
}

export function auditUnarchive(
  entityName: AuditEntityName,
  entityId: string,
  before: object,
  after: object
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'unarchive',
    before,
    after,
  })
}

export function auditSoftDelete(
  entityName: AuditEntityName,
  entityId: string,
  before: object,
  after: object,
  context?: { parentEntityName?: AuditEntityName | null; parentEntityId?: string | null }
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'soft_delete',
    before,
    after,
    parentEntityName: context?.parentEntityName ?? null,
    parentEntityId: context?.parentEntityId ?? null,
  })
}

export function auditRestore(
  entityName: AuditEntityName,
  entityId: string,
  before: object,
  after: object
): void {
  appendAuditEvent({
    entityName,
    entityId,
    action: 'restore',
    before,
    after,
  })
}
