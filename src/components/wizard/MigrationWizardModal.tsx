import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
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

interface MigrationWizardModalProps {
  shopVersion: string
  appVersion: string
  onLogOut: () => void
  items?: MigrationStepItem[]
}

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const

const MIGRATION_ENTITIES: MigrationStepItem[] = [
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

const MIGRATE_STATUS_CONFIG: Record<string, StatusVisual> = {
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

function summaryText(doneCount: number, total: number, tr: (key: string, opts?: Record<string, string>) => string): string {
  if (doneCount === total) return tr('wizard.migrationAllDone')
  return tr('wizard.migrationSummary', { done: String(doneCount), total: String(total) })
}

export function MigrationWizardModal({
  shopVersion,
  appVersion,
  onLogOut,
  items,
}: MigrationWizardModalProps) {
  const { t } = useTranslation()
  const language = useUserPreferencesStore((s) => s.language)
  const setLanguage = useUserPreferencesStore((s) => s.setLanguage)

  const stepItems = items ?? MIGRATION_ENTITIES
  const doneCount = stepItems.filter((i) => i.status === 'done').length

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <dialog
        open
        aria-labelledby="migration-wizard-title"
        className="relative w-full max-w-lg rounded-lg bg-surface-elevated p-6 shadow-xl sm:max-w-xl"
      >
        <div className="flex items-start justify-between">
          <h3 id="migration-wizard-title" className="text-lg font-semibold text-text">
            {t('wizard.migrationTitle')}
          </h3>
          <div className="flex gap-1">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => handleLanguageChange(code)}
                disabled={language === code}
                className={
                  language === code
                    ? 'rounded px-2 py-0.5 text-xs font-semibold text-success'
                    : 'rounded px-2 py-0.5 text-xs font-medium text-text-muted hover:bg-surface'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold tracking-tight text-text-muted sm:text-xl">
              {shopVersion}
            </span>
            <span className="mt-1 text-[11px] text-text-muted sm:text-xs">
              {t('wizard.migrationShopLabel')}
            </span>
          </div>
          <div className="flex items-center text-xl text-text-muted/40 sm:text-2xl">→</div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold tracking-tight text-success sm:text-xl">
              {appVersion}
            </span>
            <span className="mt-1 text-[11px] text-text-muted sm:text-xs">
              {t('wizard.migrationAppLabel')}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-surface p-3 sm:p-4">
          <p className="text-sm leading-relaxed text-text">
            {t('wizard.migrationDescriptionChanges')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text">
            {t('wizard.migrationDescriptionActions')}
          </p>
        </div>

        <div className="mt-5">
          <StepGrid
            label={summaryText(doneCount, stepItems.length, t)}
          >
            {stepItems.map((item) => (
              <StepCard
                key={item.entityId}
                icon={ENTITY_ICONS[item.entityId]}
                label={item.label}
                status={item.status}
                statusConfig={MIGRATE_STATUS_CONFIG}
              />
            ))}
          </StepGrid>
        </div>

        <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            data-testid="wizard-migration-continue"
            disabled
            className="btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto"
          >
            {t('wizard.migrationContinue')}
          </button>
          <button
            type="button"
            data-testid="wizard-migration-logout"
            onClick={onLogOut}
            className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text hover:bg-surface sm:w-auto"
          >
            {t('wizard.migrationLogOut')}
          </button>
        </div>
      </dialog>
    </div>
  )
}
