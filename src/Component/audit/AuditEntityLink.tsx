import { Link } from 'react-router-dom'
import type { AuditEntityName } from '@/Entity/AuditEntry'
import { useEntityManager } from '@/Hook/useEntityManager'
import { resolveAuditEntity } from './auditEntityResolver'

interface AuditEntityLinkProps {
  entityName: AuditEntityName | ''
  entityId: string
  /** Snapshots of the audited row, used when the entity no longer resolves live. */
  beforeJson?: string
  afterJson?: string
}

/**
 * The entity reference of one audit row: a link to the entity when we can name
 * it and it has a detail page, plain text otherwise. Long names truncate rather
 * than widening the column.
 */
export function AuditEntityLink({
  entityName,
  entityId,
  beforeJson = '',
  afterJson = '',
}: AuditEntityLinkProps) {
  const em = useEntityManager()
  const { label, to } = resolveAuditEntity(
    em,
    entityName,
    entityId,
    beforeJson,
    afterJson
  )

  if (to === null) {
    return (
      <span className="block truncate" title={label}>
        {label}
      </span>
    )
  }
  return (
    <Link
      to={to}
      className="block truncate text-primary hover:underline"
      title={label}
    >
      {label}
    </Link>
  )
}
