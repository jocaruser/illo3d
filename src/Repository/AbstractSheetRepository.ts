import type { SheetName } from '@/Config/schema'
import type { AuditEntityName } from '@/Entity/AuditEntry'
import { isLifecycleTrue, type SheetEntity, type SheetRecord } from '@/Entity/SheetEntity'
import type { AuditLogger, AuditParent } from '@/Service/AuditLogger'
import { nextId } from '@/Service/IdGenerator'
import type { TabAccess } from '@/Store/TabAccess'
import {
  appendRecord,
  findRecordById,
  matrixToRecords,
  removeRecordById,
  updateRecordById,
} from './Matrix'

export interface EntityWithId extends SheetEntity {
  id: string
}

/**
 * Base class for the typed per-entity repositories (think Doctrine's
 * `ServiceEntityRepository`). Reads hydrate entity classes from the workbook
 * snapshot; writes go back to the snapshot AND emit an audit entry with the
 * action inferred from the lifecycle transition:
 *
 *   no existing row            → create
 *   archived '' → 'true'       → archive
 *   deleted  '' → 'true'       → delete   (soft delete)
 *   archived/deleted 'true'→'' → restore
 *   anything else              → update
 */
export abstract class AbstractSheetRepository<T extends EntityWithId> {
  constructor(
    protected readonly tabs: TabAccess,
    protected readonly audit: AuditLogger,
  ) {}

  protected abstract readonly sheet: SheetName
  protected abstract readonly auditEntityName: AuditEntityName
  protected abstract readonly idPrefix: string
  protected abstract hydrate(record: SheetRecord): T

  findAll(): T[] {
    return matrixToRecords(this.sheet, this.tabs.getTab(this.sheet)).map((record) =>
      this.hydrate(record),
    )
  }

  findActive(): T[] {
    return this.findAll().filter((entity) => entity.isActive())
  }

  find(id: string): T | null {
    const record = findRecordById(this.sheet, this.tabs.getTab(this.sheet), id)
    return record ? this.hydrate(record) : null
  }

  /** Next prefixed id derived from the ids currently in the snapshot. */
  nextId(): string {
    // rowToRecord fills every canonical column, so `id` is always a string.
    const ids = matrixToRecords(this.sheet, this.tabs.getTab(this.sheet)).map(
      (record) => record.id,
    )
    return nextId(this.idPrefix, ids)
  }

  /**
   * Insert or update the entity's row and write the matching audit entry.
   * Pass `parent` when the write is part of a cascade so the audit trail
   * records what triggered it.
   */
  save(entity: T, parent?: AuditParent): T {
    const before = findRecordById(this.sheet, this.tabs.getTab(this.sheet), entity.id)
    const after = entity.toRecord()
    if (before === null) {
      this.tabs.mutateTab(this.sheet, (matrix) => appendRecord(this.sheet, matrix, after))
      this.audit.log(this.auditEntityName, 'create', null, after, parent)
    } else {
      this.tabs.mutateTab(this.sheet, (matrix) => updateRecordById(this.sheet, matrix, after))
      this.audit.log(this.auditEntityName, inferAction(before, after), before, after, parent)
    }
    return entity
  }

  /** Physically remove a row (tag links only) and audit it as a delete. */
  remove(id: string, parent?: AuditParent): void {
    const before = findRecordById(this.sheet, this.tabs.getTab(this.sheet), id)
    if (before === null) return
    this.tabs.mutateTab(this.sheet, (matrix) => removeRecordById(this.sheet, matrix, id))
    this.audit.log(this.auditEntityName, 'delete', before, null, parent)
  }
}

export function inferAction(
  before: SheetRecord,
  after: SheetRecord,
): 'archive' | 'delete' | 'restore' | 'update' {
  const wasArchived = isLifecycleTrue(before.archived ?? '')
  const wasDeleted = isLifecycleTrue(before.deleted ?? '')
  const nowArchived = isLifecycleTrue(after.archived ?? '')
  const nowDeleted = isLifecycleTrue(after.deleted ?? '')
  if (!wasDeleted && nowDeleted) return 'delete'
  if (!wasArchived && nowArchived) return 'archive'
  if ((wasDeleted && !nowDeleted) || (wasArchived && !nowArchived)) return 'restore'
  return 'update'
}
