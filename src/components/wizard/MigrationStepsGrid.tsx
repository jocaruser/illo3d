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

const STATUS_CONFIG: Record<string, StatusVisual> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-400', iconBg: 'bg-gray-300', iconColor: 'text-gray-400', showCheckIcon: false },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-500', iconColor: 'text-white', showCheckIcon: false, pulse: true },
  done: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-500', iconColor: 'text-white', showCheckIcon: true },
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

export function MigrationStepsGrid() {
  const { t } = useTranslation()

  return (
    <StepGrid label={t('wizard.migrationSummary', { done: '0', total: String(ENTITIES.length) })}>
      {ENTITIES.map((item) => (
        <StepCard
          key={item.entityId}
          icon={ENTITY_ICONS[item.entityId]}
          label={item.label}
          status="pending"
          statusConfig={STATUS_CONFIG}
        />
      ))}
    </StepGrid>
  )
}
