import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { StepGrid } from '@/components/shared/StepGrid'
import { StepCard, type StatusVisual } from '@/components/shared/StepCard'
import {
  useMigrationStore,
  type MigrationStepState,
} from '@/stores/migrationStore'
import {
  ArchiveBoxIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyDollarIcon,
  LinkIcon,
  ShieldExclamationIcon,
  Square3Stack3DIcon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

interface EntityDef {
  entityId: string
  label: string
}

const ENTITIES: EntityDef[] = [
  { entityId: 'backup', label: 'Backup' },
  { entityId: 'clients', label: 'Clients' },
  { entityId: 'crm_notes', label: 'CRM Notes' },
  { entityId: 'tags', label: 'Tags' },
  { entityId: 'tag_links', label: 'Tag Links' },
  { entityId: 'jobs', label: 'Jobs' },
  { entityId: 'pieces', label: 'Pieces' },
  { entityId: 'piece_items', label: 'Piece Items' },
  { entityId: 'inventory', label: 'Inventory' },
  { entityId: 'lots', label: 'Lots' },
  { entityId: 'transactions', label: 'Transactions' },
  { entityId: 'audit_log', label: 'Audit Log' },
]

const LABEL_BY_ID = new Map(ENTITIES.map((e) => [e.entityId, e.label]))

const STATUS_CONFIG: Record<string, StatusVisual> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-400', iconBg: 'bg-gray-300', iconColor: 'text-gray-400', showCheckIcon: false },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-500', iconColor: 'text-white', showCheckIcon: false, pulse: true },
  done: { bg: 'bg-green-100', text: 'text-green-800', iconBg: 'bg-green-600', iconColor: 'text-white', showCheckIcon: true },
  failed: { bg: 'bg-red-100', text: 'text-red-800', iconBg: 'bg-red-600', iconColor: 'text-white', showCheckIcon: false },
}

const ENTITY_ICONS: Record<string, ReactNode> = {
  backup: <ShieldExclamationIcon />,
  clients: <UsersIcon />,
  crm_notes: <ChatBubbleLeftRightIcon />,
  tags: <TagIcon />,
  tag_links: <LinkIcon />,
  jobs: <BriefcaseIcon />,
  pieces: <CubeIcon />,
  piece_items: <ClipboardDocumentListIcon />,
  inventory: <ArchiveBoxIcon />,
  lots: <Square3Stack3DIcon />,
  transactions: <CurrencyDollarIcon />,
  audit_log: <ClipboardDocumentCheckIcon />,
}

interface GridItem {
  entityId: string
  label: string
  status: string
  detail?: string
}

interface MigrationStepsGridProps {
  backupAnswer?: boolean | null
}

export function MigrationStepsGrid({ backupAnswer }: MigrationStepsGridProps) {
  const { t } = useTranslation()
  const phase = useMigrationStore((s) => s.phase)
  const storeSteps = useMigrationStore((s) => s.steps)

  const items =
    phase === 'idle'
      ? idleItems(backupAnswer, t)
      : runItems(storeSteps, t)

  const doneCount = items.filter((item) => item.status === 'done').length
  const summary =
    doneCount === items.length && items.length > 0
      ? t('wizard.migrationAllDone')
      : t('wizard.migrationSummary', {
          done: String(doneCount),
          total: String(items.length),
        })

  return (
    <StepGrid label={summary}>
      {items.map((item) => (
        <StepCard
          key={item.entityId}
          icon={ENTITY_ICONS[item.entityId]}
          label={item.label}
          status={item.status}
          detail={item.detail}
          statusConfig={STATUS_CONFIG}
        />
      ))}
    </StepGrid>
  )
}

function idleItems(
  backupAnswer: boolean | null | undefined,
  t: (key: string) => string
): GridItem[] {
  const backupSkipped = backupAnswer === false
  return ENTITIES.map((entity) => {
    const isSkippedBackup = entity.entityId === 'backup' && backupSkipped
    return {
      entityId: entity.entityId,
      label: entity.label,
      status: isSkippedBackup ? 'done' : 'pending',
      detail: isSkippedBackup ? t('wizard.migrationBackupSkipped') : undefined,
    }
  })
}

function runItems(
  steps: MigrationStepState[],
  t: (key: string) => string
): GridItem[] {
  return steps.map((step) => ({
    entityId: step.id,
    label: LABEL_BY_ID.get(step.id) ?? step.id,
    status: step.status,
    detail:
      step.error ?? (step.description ? t(step.description) : undefined),
  }))
}
