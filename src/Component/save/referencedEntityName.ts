import type { AuditEntityName } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'

/** Columns that always reference one entity type. */
const REFERENCE_COLUMN: Record<string, AuditEntityName> = {
  client_id: 'client',
  job_id: 'job',
  piece_id: 'piece',
  inventory_id: 'inventory',
  transaction_id: 'transaction',
  tag_id: 'tag',
}

/**
 * The entity a column's value points at, or null for plain values.
 * Polymorphic columns read their discriminator from the same record:
 * `entity_id` follows `entity_type` (notes, tag links) and `ref_id` follows
 * `ref_type` (transactions).
 */
export function referencedEntityName(
  column: string,
  record: SheetRecord
): AuditEntityName | null {
  const fixed = REFERENCE_COLUMN[column]
  if (fixed !== undefined) return fixed
  if (column === 'entity_id') {
    const type = record.entity_type ?? ''
    return type === 'client' || type === 'job' ? type : null
  }
  if (column === 'ref_id') return (record.ref_type ?? '') === 'job' ? 'job' : null
  return null
}
