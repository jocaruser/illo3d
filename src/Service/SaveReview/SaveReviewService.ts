import type { AuditEntityName } from '@/Entity/AuditEntry'
import { findRecordById, updateRecordById } from '@/Repository/Matrix'
import type { AuditLogger } from '@/Service/AuditLogger'
import type { TabAccess } from '@/Store/TabAccess'
import { ENTITY_SHEET } from './saveDiff'

/**
 * Mutations offered by the save preview itself. A revert is an ordinary edit:
 * it goes back through the audit logger, so the net diff (first before vs
 * last after) simply stops reporting the field — and the audit trail keeps an
 * honest record of the change and its undoing.
 */
export class SaveReviewService {
  constructor(
    private readonly tabs: TabAccess,
    private readonly audit: AuditLogger
  ) {}

  /** Set one column of a live row back to the value the diff shows as `before`. */
  revertField(
    entityName: AuditEntityName,
    entityId: string,
    column: string,
    value: string
  ): void {
    const sheet = ENTITY_SHEET[entityName]
    const before = findRecordById(sheet, this.tabs.getTab(sheet), entityId)
    if (before === null) return
    if ((before[column] ?? '') === value) return
    const after = { ...before, [column]: value }
    this.tabs.mutateTab(sheet, (matrix) => updateRecordById(sheet, matrix, after))
    this.audit.log(entityName, 'update', before, after)
  }
}
