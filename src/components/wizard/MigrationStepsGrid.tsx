import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { StepGrid } from '@/components/shared/StepGrid'
import { StepCard, type StatusVisual } from '@/components/shared/StepCard'
import {
  ArchiveBoxIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyDollarIcon,
  LinkIcon,
  Square3Stack3DIcon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

export interface MigrationStepItem {
  entityId: string
  label: string
  status: 'pending' | 'running' | 'done'
}

interface MigrationStepsGridProps {
  items?: MigrationStepItem[]
}

const DEFAULT_ENTITIES: MigrationStepItem[] = [
  { entityId: 'clients', label: 'Clients', status: 'pending' },
  { entityId: 'crm_notes', label: 'CRM Notes', status: 'pending' },
  { entityId: 'tags', label: 'Tags', status: 'pending' },
  { entityId: 'tag_links', label: 'Tag Links', status: 'pending' },
  { entityId: 'jobs', label: 'Jobs', status: 'pending' },
  { entityId: 'pieces', label: 'Pieces', status: 'pending' },
  { entityId: 'piece_items', label: 'Piece Items', status: 'pending' },
  { entityId: 'inventory', label: 'Inventory', status: 'pending' },
  { entityId: 'lots', label: 'Lots', status: 'pending' },
  { entityId: 'transactions', label: 'Transactions', status: 'pending' },
  { entityId: 'audit_log', label: 'Audit Log', status: 'pending' },
]

const STATUS_CONFIG: Record<string, StatusVisual> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-400', iconBg: 'bg-gray-300', iconColor: 'text-gray-400', showCheckIcon: false },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-500', iconColor: 'text-white', showCheckIcon: false, pulse: true },
  done: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-500', iconColor: 'text-white', showCheckIcon: true },
}

const ENTITY_ICONS: Record<string, ReactNode> = {
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

export function MigrationStepsGrid({ items }: MigrationStepsGridProps) {
  const { t } = useTranslation()
  const stepItems = items ?? DEFAULT_ENTITIES
  const doneCount = stepItems.filter((i) => i.status === 'done').length
  const total = stepItems.length
  const summary = doneCount === total
    ? t('wizard.migrationAllDone')
    : t('wizard.migrationSummary', { done: String(doneCount), total: String(total) })

  return (
    <StepGrid label={summary}>
      {stepItems.map((item) => (
        <StepCard
          key={item.entityId}
          icon={ENTITY_ICONS[item.entityId]}
          label={item.label}
          status={item.status}
          statusConfig={STATUS_CONFIG}
        />
      ))}
    </StepGrid>
  )
}
