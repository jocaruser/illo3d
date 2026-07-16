import { AuditEntry, type AuditAction, type AuditEntityName } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { appendRecord, matrixToRecords } from '@/Repository/Matrix'
import type { TabAccess } from '@/Store/TabAccess'
import { isoInstant, type Clock } from './Clock'
import { nextId } from './IdGenerator'

/** Identifies the immediate parent entity during cascaded operations. */
export interface AuditParent {
  entityName: AuditEntityName
  entityId: string
}

/**
 * Appends immutable rows to the `audit_log` tab. Every domain mutation flows
 * through here (via the entity repositories), so the log is a complete,
 * uniform change history: full before/after snapshots plus the list of
 * changed columns.
 */
export class AuditLogger {
  constructor(
    private readonly tabs: TabAccess,
    private readonly clock: Clock,
    private readonly actorProvider: () => string,
  ) {}

  log(
    entityName: AuditEntityName,
    action: AuditAction,
    before: SheetRecord | null,
    after: SheetRecord | null,
    parent?: AuditParent,
  ): AuditEntry {
    const entry = new AuditEntry()
    entry.id = nextId('AL', this.existingIds())
    entry.timestamp = isoInstant(this.clock)
    entry.actor = this.actorProvider()
    entry.entityName = entityName
    entry.entityId = (after?.id ?? before?.id ?? '') as string
    entry.action = action
    entry.beforeJson = before ? JSON.stringify(stripLifecycleEmpty(before)) : ''
    entry.afterJson = after ? JSON.stringify(stripLifecycleEmpty(after)) : ''
    entry.fieldsChanged = computeFieldsChanged(before, after).join(';')
    entry.parentEntityName = parent?.entityName ?? ''
    entry.parentEntityId = parent?.entityId ?? ''

    this.tabs.mutateTab('audit_log', (matrix) => appendRecord('audit_log', matrix, entry.toRecord()))
    return entry
  }

  private existingIds(): string[] {
    return matrixToRecords('audit_log', this.tabs.getTab('audit_log')).map(
      (record) => record.id ?? '',
    )
  }
}

/**
 * Columns whose value differs between the two snapshots (missing keys count
 * as ''). For creates this yields every non-empty column; for lifecycle
 * transitions it names the flipped flag.
 */
export function computeFieldsChanged(
  before: SheetRecord | null,
  after: SheetRecord | null,
): string[] {
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  const changed: string[] = []
  for (const key of keys) {
    if ((before?.[key] ?? '') !== (after?.[key] ?? '')) changed.push(key)
  }
  return changed
}

/** Snapshot cosmetics: drop empty lifecycle flags so JSON matches historic entries. */
function stripLifecycleEmpty(record: SheetRecord): SheetRecord {
  const snapshot: SheetRecord = {}
  for (const [key, value] of Object.entries(record)) {
    if ((key === 'archived' || key === 'deleted') && value === '') continue
    snapshot[key] = value
  }
  return snapshot
}
