import { Link } from 'react-router-dom'
import { resolveAuditEntity } from '@/Component/audit/auditEntityResolver'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { useEntityManager } from '@/Hook/useEntityManager'
import { referencedEntityName } from './referencedEntityName'

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
