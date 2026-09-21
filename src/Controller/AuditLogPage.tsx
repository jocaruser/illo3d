import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { AuditTable } from '@/Component/audit/AuditTable'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_NAMES,
  type AuditEntry,
} from '@/Entity/AuditEntry'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useListTableDiscovery } from '@/Hook/useListTableDiscovery'
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
  const [action, setAction] = useState<string>(ALL)
  const [entityName, setEntityName] = useState<string>(ALL)

  const entries = useMemo(() => em.auditLog.findAll(), [em])

  const sourceRows = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (action === ALL || entry.action === action) &&
          (entityName === ALL || entry.entityName === entityName)
      ),
    [entries, action, entityName]
  )

  const {
    query,
    setQuery,
    rows: visible,
  } = useListTableDiscovery({
    sourceRows,
    getSearchBlob: auditSearchBlob,
    messages: {
      collectionEmpty: t('auditLog.empty'),
      noMatches: t('listTable.noMatches'),
    },
  })

  const emptyMessage =
    entries.length === 0 ? t('auditLog.empty') : t('listTable.noMatches')

  const actionOptions: ComboboxItem[] = [
    { key: ALL, label: t('auditLog.filterAllActions') },
    ...AUDIT_ACTIONS.map((value) => ({
      key: value,
      label: t(`auditLog.action.${value}`),
    })),
  ]
  const entityOptions: ComboboxItem[] = [
    { key: ALL, label: t('auditLog.filterAllEntities') },
    ...AUDIT_ENTITY_NAMES.map((value) => ({
      key: value,
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
            <Combobox
              ariaLabel={t('auditLog.filterActionAria')}
              items={actionOptions}
              value={action}
              onChange={setAction}
            />
            <Combobox
              ariaLabel={t('auditLog.filterEntityAria')}
              items={entityOptions}
              value={entityName}
              onChange={setEntityName}
            />
          </>
        }
      />
      <AuditTable entries={visible} emptyMessage={emptyMessage} />
    </div>
  )
}
