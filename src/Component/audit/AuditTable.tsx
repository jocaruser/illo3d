import { useTranslation } from 'react-i18next'
import { RelativeTime } from '@/Component/RelativeTime'
import { cx } from '@/Component/cx'
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Component/table/DataTable'
import type { AuditEntry } from '@/Entity/AuditEntry'
import { AuditActionPill } from './AuditActionPill'
import { AuditEntityLink } from './AuditEntityLink'

interface AuditTableProps {
  /** Already ordered by the repository (timestamp desc, id asc). */
  entries: AuditEntry[]
  emptyMessage: string
}

const COLUMN_COUNT = 6

/** An entry we cannot place in time or identify is a broken row, not a normal one. */
function isMalformed(entry: AuditEntry): boolean {
  return entry.id === '' || entry.timestamp === ''
}

export function AuditTable({ entries, emptyMessage }: AuditTableProps) {
  const { t } = useTranslation()
  return (
    <DataTable>
      <TableHead>
        <TableRow>
          <TableHeader className="max-w-[100px] whitespace-nowrap">
            {t('auditLog.colId')}
          </TableHeader>
          <TableHeader>{t('auditLog.colActor')}</TableHeader>
          <TableHeader>{t('auditLog.colAction')}</TableHeader>
          <TableHeader>{t('auditLog.colEntity')}</TableHeader>
          <TableHeader className="whitespace-nowrap">{t('auditLog.colTimestamp')}</TableHeader>
          <TableHeader>{t('auditLog.colParentEntity')}</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.length === 0 ? (
          <tr>
            <td
              colSpan={COLUMN_COUNT}
              data-testid="audit-log-empty-state"
              className="px-4 py-8 text-center text-sm text-text-muted"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          entries.map((entry, index) => (
            <TableRow
              key={entry.id === '' ? `malformed-${index}` : entry.id}
              className={cx(isMalformed(entry) && 'text-danger')}
            >
              <TableCell className="max-w-[100px] whitespace-nowrap">{entry.id}</TableCell>
              <TableCell>{entry.actor}</TableCell>
              <TableCell>
                <AuditActionPill action={entry.action} />
              </TableCell>
              <TableCell className="max-w-[220px]">
                <AuditEntityLink
                  entityName={entry.entityName}
                  entityId={entry.entityId}
                  beforeJson={entry.beforeJson}
                  afterJson={entry.afterJson}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {entry.timestamp === '' ? null : <RelativeTime value={entry.timestamp} />}
              </TableCell>
              <TableCell className="max-w-[220px]">
                <AuditEntityLink
                  entityName={entry.parentEntityName}
                  entityId={entry.parentEntityId}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  )
}
