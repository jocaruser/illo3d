import { AuditEntry } from '@/Entity/AuditEntry'
import { matrixToRecords } from '@/Repository/Matrix'
import type { TabAccess } from '@/Store/TabAccess'

/**
 * Read-only access to the immutable audit log. Writes happen exclusively
 * through `AuditLogger`.
 */
export class AuditLogRepository {
  constructor(private readonly tabs: TabAccess) {}

  /** All entries, newest first (timestamp desc, id asc tiebreak). */
  findAll(): AuditEntry[] {
    return matrixToRecords('audit_log', this.tabs.getTab('audit_log'))
      .map((record) => AuditEntry.fromRecord(record))
      .sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? 1 : -1
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      })
  }
}
