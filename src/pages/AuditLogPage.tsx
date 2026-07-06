import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeaderCell,
  DataTableEmptyState,
} from '@/components/DataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const COLUMNS = [
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

export function AuditLogPage() {
  const { t } = useTranslation()
  const [loading] = useState(false)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ListTablePageHeader title={t('auditLog.title')} />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableRow>
              {COLUMNS.map((col) => (
                <DataTableHeaderCell key={col}>{col}</DataTableHeaderCell>
              ))}
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            <DataTableEmptyState colSpan={COLUMNS.length}>
              {t('auditLog.empty')}
            </DataTableEmptyState>
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
