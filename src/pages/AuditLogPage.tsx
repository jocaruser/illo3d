import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { AuditEntry, AuditEntityName } from '@/types/money'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { RelativeTime } from '@/components/RelativeTime'
import { useSnapshotAuditEntries } from '@/stores/workbookStore'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeaderCell,
  DataTableCell,
  DataTableEmptyState,
} from '@/components/DataTable'

const COLUMNS = [
  'id',
  'actor',
  'action',
  'entity_name',
  'timestamp',
  'parent_entity_name',
] as const

const COLUMN_KEY: Record<(typeof COLUMNS)[number], string> = {
  id: 'auditLog.colId',
  actor: 'auditLog.colActor',
  action: 'auditLog.colAction',
  entity_name: 'auditLog.colEntity',
  timestamp: 'auditLog.colTimestamp',
  parent_entity_name: 'auditLog.colParentEntity',
}

type WorkbookEntities = ReturnType<typeof useWorkbookEntities>

type EntityDisplay = {
  name: string
  href?: string
}

function parseJsonSafely(json: string): Record<string, unknown> | null {
  if (!json || json.trim() === '') return null
  try {
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function resolveEntityDisplay(
  entityName: AuditEntityName,
  entityId: string,
  entities: WorkbookEntities,
  afterJson: string,
  beforeJson: string,
): EntityDisplay {
  // Tier 1: current workbook lookup
  switch (entityName) {
    case 'client': {
      const client = entities.clients.find((c) => c.id === entityId)
      if (client?.name) return { name: client.name, href: `/clients/${entityId}` }
      break
    }
    case 'job': {
      const job = entities.jobs.find((j) => j.id === entityId)
      if (job?.description) return { name: job.description, href: `/jobs/${entityId}` }
      break
    }
    case 'piece': {
      const piece = entities.pieces.find((p) => p.id === entityId)
      if (piece?.name) {
        return {
          name: piece.name,
          href: piece.job_id ? `/jobs/${piece.job_id}` : undefined,
        }
      }
      break
    }
    case 'piece_item': {
      const pieceItem = entities.pieceItems.find((pi) => pi.id === entityId)
      const pieceId = pieceItem?.piece_id
      if (pieceId) {
        const piece = entities.pieces.find((p) => p.id === pieceId)
        if (piece?.name && piece.job_id) {
          return { name: `Item for ${piece.name}`, href: `/jobs/${piece.job_id}` }
        }
      }
      break
    }
    case 'inventory': {
      const inv = entities.inventory.find((i) => i.id === entityId)
      if (inv?.name) return { name: inv.name, href: `/inventory/${entityId}` }
      break
    }
    case 'lot': {
      const lot = entities.lots.find((l) => l.id === entityId)
      if (lot?.transaction_id) {
        const tx = entities.transactions.find((t) => t.id === lot.transaction_id)
        if (tx?.concept) {
          return { name: tx.concept, href: `/transactions/${lot.transaction_id}` }
        }
      }
      break
    }
    case 'transaction': {
      const tx = entities.transactions.find((t) => t.id === entityId)
      if (tx?.concept) return { name: tx.concept, href: `/transactions/${entityId}` }
      break
    }
    case 'tag': {
      const tag = entities.tags.find((t) => t.id === entityId)
      if (tag?.name) return { name: tag.name }
      break
    }
    case 'tag_link':
    case 'crm_note':
    case 'purchase':
    case 'client_note':
    case 'job_note':
      break
  }

  // Tier 2: JSON fallback
  const afterData = parseJsonSafely(afterJson) ?? parseJsonSafely(beforeJson)
  if (afterData) {
    switch (entityName) {
      case 'client':
      case 'piece':
      case 'inventory':
      case 'tag': {
        const name = afterData.name
        if (typeof name === 'string' && name) {
          const href =
            entityName === 'client'
              ? `/clients/${entityId}`
              : entityName === 'inventory'
                ? `/inventory/${entityId}`
                : undefined
          return { name, href }
        }
        break
      }
      case 'job': {
        const desc = afterData.description
        if (typeof desc === 'string' && desc) {
          return { name: desc, href: `/jobs/${entityId}` }
        }
        break
      }
      case 'transaction': {
        const concept = afterData.concept
        if (typeof concept === 'string' && concept) {
          return { name: concept, href: `/transactions/${entityId}` }
        }
        break
      }
      case 'piece_item': {
        const pieceId = afterData.piece_id
        if (typeof pieceId === 'string' && pieceId) {
          const piece = entities.pieces.find((p) => p.id === pieceId)
          if (piece?.name && piece.job_id) {
            return { name: `Item for ${piece.name}`, href: `/jobs/${piece.job_id}` }
          }
        }
        break
      }
      case 'lot': {
        const transactionId = afterData.transaction_id
        if (typeof transactionId === 'string' && transactionId) {
          const tx = entities.transactions.find((t) => t.id === transactionId)
          if (tx?.concept) {
            return { name: tx.concept, href: `/transactions/${transactionId}` }
          }
        }
        break
      }
      default:
        break
    }
  }

  // Tier 3: raw ID
  return { name: entityId }
}

function resolveParentDisplay(
  entry: AuditEntry,
  entities: WorkbookEntities,
): EntityDisplay | null {
  if (!entry.parent_entity_name || !entry.parent_entity_id) return null
  return resolveEntityDisplay(
    entry.parent_entity_name as AuditEntityName,
    entry.parent_entity_id,
    entities,
    '',
    '',
  )
}

function actionPillClass(action: string): string {
  switch (action) {
    case 'create':
    case 'restore':
      return 'bg-success/15 text-success'
    case 'update':
      return 'bg-primary/15 text-primary'
    case 'delete':
    case 'archive':
      return 'bg-danger/15 text-danger'
    default:
      return 'bg-surface-alt text-text-muted'
  }
}

export function AuditLogPage() {
  const { t } = useTranslation()
  const entries = useSnapshotAuditEntries()
  const entities = useWorkbookEntities()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" data-testid="audit-log-page">
      <ListTablePageHeader title={t('auditLog.title')} />
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell className="max-w-[100px] whitespace-nowrap">
              {t(COLUMN_KEY.id)}
            </DataTableHeaderCell>
            <DataTableHeaderCell className="whitespace-nowrap">
              {t(COLUMN_KEY.actor)}
            </DataTableHeaderCell>
            <DataTableHeaderCell className="whitespace-nowrap">
              {t(COLUMN_KEY.action)}
            </DataTableHeaderCell>
            <DataTableHeaderCell className="max-w-xs">
              {t(COLUMN_KEY.entity_name)}
            </DataTableHeaderCell>
            <DataTableHeaderCell className="whitespace-nowrap">
              {t(COLUMN_KEY.timestamp)}
            </DataTableHeaderCell>
            <DataTableHeaderCell className="max-w-xs">
              {t(COLUMN_KEY.parent_entity_name)}
            </DataTableHeaderCell>
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
              const entityDisplay = resolveEntityDisplay(
                entry.entity_name,
                entry.entity_id,
                entities,
                entry.after_json,
                entry.before_json,
              )
              const parentDisplay = resolveParentDisplay(entry, entities)
              return (
                <DataTableRow
                  key={entry.id || `row-${index}`}
                  isEven={index % 2 === 0}
                  className={
                    isMalformed
                      ? '!bg-red-50 dark:!bg-red-950 text-red-900 dark:text-red-200'
                      : ''
                  }
                >
                  <DataTableCell className="max-w-[100px] whitespace-nowrap truncate">
                    {entry.id}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap">
                    {entry.actor}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionPillClass(entry.action)}`}
                    >
                      {entry.action.toUpperCase()}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="max-w-xs truncate">
                    {entityDisplay.href ? (
                      <Link
                        to={entityDisplay.href}
                        className="text-primary hover:text-primary-hover hover:underline"
                      >
                        {entityDisplay.name}
                      </Link>
                    ) : (
                      entityDisplay.name
                    )}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap">
                    <RelativeTime timestamp={entry.timestamp} />
                  </DataTableCell>
                  <DataTableCell className="max-w-xs truncate">
                    {parentDisplay ? (
                      parentDisplay.href ? (
                        <Link
                          to={parentDisplay.href}
                          className="text-primary hover:text-primary-hover hover:underline"
                        >
                          {parentDisplay.name}
                        </Link>
                      ) : (
                        parentDisplay.name
                      )
                    ) : (
                      ''
                    )}
                  </DataTableCell>
                </DataTableRow>
              )
            })
          )}
        </DataTableBody>
      </DataTable>
    </div>
  )
}
