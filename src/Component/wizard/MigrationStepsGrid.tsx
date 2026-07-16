import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  BriefcaseIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  DocumentTextIcon,
  LinkIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { StepCard, type StepStatusConfig } from '@/Component/StepCard'
import { StepGrid } from '@/Component/StepGrid'
import { BACKUP_STEP_ID } from '@/Hook/useMigration'
import {
  migrationStepStates,
  stepLabelKey,
  stepStatusKey,
} from './migrationSteps'
import {
  useMigrationStore,
  type MigrationStepState,
} from '@/Store/migrationStore'

const STATUS_STYLE: StepStatusConfig = {
  pending: { container: 'border-border bg-surface-alt text-text-muted' },
  running: { container: 'border-accent/50 bg-accent/10 text-accent' },
  done: {
    container: 'border-success/50 bg-success/10 text-success',
    showCheckIcon: true,
  },
  failed: { container: 'border-danger/50 bg-danger/10 text-danger' },
}

const ICON_CLASS = 'h-4 w-4 shrink-0'

const STEP_ICON: Record<string, ReactNode> = {
  [BACKUP_STEP_ID]: (
    <ShieldCheckIcon className={ICON_CLASS} aria-hidden="true" />
  ),
  clients: <UsersIcon className={ICON_CLASS} aria-hidden="true" />,
  crm_notes: (
    <ChatBubbleLeftRightIcon className={ICON_CLASS} aria-hidden="true" />
  ),
  tags: <TagIcon className={ICON_CLASS} aria-hidden="true" />,
  tag_links: <LinkIcon className={ICON_CLASS} aria-hidden="true" />,
  jobs: <BriefcaseIcon className={ICON_CLASS} aria-hidden="true" />,
  pieces: <CubeIcon className={ICON_CLASS} aria-hidden="true" />,
  piece_items: <Squares2X2Icon className={ICON_CLASS} aria-hidden="true" />,
  inventory: (
    <BuildingStorefrontIcon className={ICON_CLASS} aria-hidden="true" />
  ),
  lots: <ArchiveBoxIcon className={ICON_CLASS} aria-hidden="true" />,
  transactions: <BanknotesIcon className={ICON_CLASS} aria-hidden="true" />,
  audit_log: (
    <ClipboardDocumentListIcon className={ICON_CLASS} aria-hidden="true" />
  ),
}

const FALLBACK_ICON = (
  <DocumentTextIcon className={ICON_CLASS} aria-hidden="true" />
)

interface MigrationStepsGridProps {
  shopVersion: string
  /** null until the user answers the backup question. */
  keepOriginalAsBackup: boolean | null
}

export function MigrationStepsGrid({
  shopVersion,
  keepOriginalAsBackup,
}: MigrationStepsGridProps) {
  const { t } = useTranslation()
  const phase = useMigrationStore((state) => state.phase)
  const liveSteps = useMigrationStore((state) => state.steps)
  const rows = migrationStepStates(
    phase,
    liveSteps,
    shopVersion,
    keepOriginalAsBackup
  )

  return (
    <StepGrid>
      {rows.map((row) => (
        <MigrationStepCard key={row.id} row={row} label={rowLabel(row.id, t)} />
      ))}
    </StepGrid>
  )
}

type Translate = ReturnType<typeof useTranslation>['t']

/** Unknown ids (a plan we do not ship labels for) fall back to the raw id. */
function rowLabel(id: string, t: Translate): string {
  const key = stepLabelKey(id)
  return key === null ? id : t(key)
}

interface MigrationStepCardProps {
  row: MigrationStepState
  label: string
}

function MigrationStepCard({ row, label }: MigrationStepCardProps) {
  const { t } = useTranslation()
  // A step's error is a raw backend message; its description is an i18n key
  // streamed by the running step.
  const detail =
    row.error ??
    (row.description === undefined ? undefined : t(row.description))

  return (
    <div
      data-testid={`wizard-migration-step-${row.id}`}
      aria-label={t('wizard.migrationStepStatus', {
        label,
        status: t(stepStatusKey(row.status)),
      })}
    >
      <StepCard
        label={label}
        status={row.status}
        statusConfig={STATUS_STYLE}
        detail={detail}
        icon={STEP_ICON[row.id] ?? FALLBACK_ICON}
        pulse={row.status === 'running'}
      />
    </div>
  )
}
