import type { AuditAction, AuditEntityName } from '@/types/money'

export type AuditSnapshot = Record<string, unknown>

export interface AuditEvent {
  entityName: AuditEntityName
  entityId: string
  action: AuditAction
  before: AuditSnapshot | null
  after: AuditSnapshot | null
  parentEntityName?: AuditEntityName | null
  parentEntityId?: string | null
}

export interface AuditEventContext {
  parentEntityName?: AuditEntityName | null
  parentEntityId?: string | null
}
