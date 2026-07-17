import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select, type SelectOption } from '@/Component/Select'
import { AuditTable } from '@/Component/audit/AuditTable'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_NAMES,
  type AuditEntry,
} from '@/Entity/AuditEntry'
import { useEntityManager } from '@/Hook/useEntityManager'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { joinSearchParts } from '@/Service/Search/searchBlobs'

/** '' means "no filter" for both selects. */
const ALL = ''

function auditSearchBlob(entry: AuditEntry): string {
  return joinSearchParts([
    entry.id,
    entry.actor,
    entry.entityName,
    entry.entityId,
    entry.action,
  ])
}

/**
 * The audit log reader: every domain mutation writes a row, this page is where
 * they are read. Entries are immutable, so the page is strictly read-only —
 * search and the two filters are the only controls.
 */
export function AuditLogPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<string>(ALL)
  const [entityName, setEntityName] = useState<string>(ALL)

  const entries = useMemo(() => em.auditLog.findAll(), [em])

  const visible = useMemo(() => {
    const filtered = entries.filter(
      (entry) =>
        (action === ALL || entry.action === action) &&
        (entityName === ALL || entry.entityName === entityName)
    )
    return fuzzyFilter(filtered, query, auditSearchBlob)
  }, [entries, action, entityName, query])

  const actionOptions: SelectOption[] = [
    { value: ALL, label: t('auditLog.filterAllActions') },
    ...AUDIT_ACTIONS.map((value) => ({
      value,
      label: t(`auditLog.action.${value}`),
    })),
  ]
  const entityOptions: SelectOption[] = [
    { value: ALL, label: t('auditLog.filterAllEntities') },
    ...AUDIT_ENTITY_NAMES.map((value) => ({
      value,
      label: t(`auditLog.entity.${value}`),
    })),
  ]

  return (
    <div data-testid="audit-log-page" className="space-y-4">
      <ListTablePageHeader
        title={t('auditLog.title')}
        search={
          <ListTableSearchField
            value={query}
            onChange={setQuery}
            placeholder={t('auditLog.searchPlaceholder')}
          />
        }
        actions={
          <>
            <Select
              aria-label={t('auditLog.filterActionAria')}
              options={actionOptions}
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="w-auto"
            />
            <Select
              aria-label={t('auditLog.filterEntityAria')}
              options={entityOptions}
              value={entityName}
              onChange={(event) => setEntityName(event.target.value)}
              className="w-auto"
            />
          </>
        }
      />
      <AuditTable
        entries={visible}
        emptyMessage={
          entries.length === 0 ? t('auditLog.empty') : t('listTable.noMatches')
        }
      />
    </div>
  )
}
