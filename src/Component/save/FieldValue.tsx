import { Link } from 'react-router-dom'
import { resolveAuditEntity } from '@/Component/audit/auditEntityResolver'
import type { AuditEntityName } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { useEntityManager } from '@/Hook/useEntityManager'

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

interface FieldValueProps {
  column: string
  value: string
  /** The whole row, for polymorphic reference discriminators. */
  record: SheetRecord
}

/**
 * One cell of the diff: empty values show as a muted dash, entity references
 * resolve to their human name and link to the entity's page exactly like the
 * audit log does.
 */
export function FieldValue({ column, value, record }: FieldValueProps) {
  const em = useEntityManager()
  if (value === '') return <span className="text-text-muted">—</span>

  const entityName = referencedEntityName(column, record)
  if (entityName === null) return <span className="break-words">{value}</span>

  const { label, to } = resolveAuditEntity(em, entityName, value)
  if (to === null) {
    return (
      <span className="break-words" title={value}>
        {label}
      </span>
    )
  }
  return (
    <Link to={to} className="break-words text-primary hover:underline" title={value}>
      {label}
    </Link>
  )
}
