import { useTranslation } from 'react-i18next'
import type { AuditEntry } from '@/types/money'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { useSnapshotAuditEntries } from '@/stores/workbookStore'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeaderCell,
  DataTableCell,
  DataTableEmptyState,
} from '@/components/DataTable'

const COLUMNS: readonly (keyof AuditEntry)[] = [
  'id',
  'timestamp',
  'actor',
  'entity_name',
  'entity_id',
  'action',
  'before_json',
  'after_json',
  'fieldsChanged',
  'parent_entity_name',
  'parent_entity_id',
]

const COLUMN_KEY: Record<(typeof COLUMNS)[number], string> = {
  id: 'auditLog.colId',
  timestamp: 'auditLog.colTimestamp',
  actor: 'auditLog.colActor',
  entity_name: 'auditLog.colEntityName',
  entity_id: 'auditLog.colEntityId',
  action: 'auditLog.colAction',
  before_json: 'auditLog.colBeforeJson',
  after_json: 'auditLog.colAfterJson',
  fieldsChanged: 'auditLog.colFieldsChanged',
  parent_entity_name: 'auditLog.colParentEntityName',
  parent_entity_id: 'auditLog.colParentEntityId',
}

export function AuditLogPage() {
  const { t } = useTranslation()
  const entries = useSnapshotAuditEntries()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" data-testid="audit-log-page">
      <ListTablePageHeader title={t('auditLog.title')} />
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            {COLUMNS.map((col) => (
              <DataTableHeaderCell key={col}>
                {t(COLUMN_KEY[col])}
              </DataTableHeaderCell>
            ))}
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {entries.length === 0 ? (
            <DataTableEmptyState colSpan={COLUMNS.length}>
              <span data-testid="audit-log-empty-state">
                {t('auditLog.empty')}
              </span>
            </DataTableEmptyState>
          ) : (
            entries.map((entry, index) => {
              const isMalformed =
                !entry.id ||
                !entry.timestamp ||
                !entry.actor ||
                !entry.entity_name ||
                !entry.entity_id ||
                !entry.action ||
                !entry.fieldsChanged
              return (
                <DataTableRow
                  key={entry.id || `row-${index}`}
                  isEven={index % 2 === 0}
                  className={isMalformed ? 'bg-red-100 hover:bg-red-200 text-danger' : ''}
                >
                  {COLUMNS.map((col) => (
                    <DataTableCell key={col}>
                      {String(entry[col] ?? '')}
                    </DataTableCell>
                  ))}
                </DataTableRow>
              )
            })
          )}
        </DataTableBody>
      </DataTable>
    </div>
  )
}
