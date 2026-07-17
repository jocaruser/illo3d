import type { ReactNode } from 'react'
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
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { SheetName } from '@/Config/schema'

const ICON_CLASS = 'h-4 w-4 shrink-0'

/**
 * Icon and label per workbook sheet, shared by every sheet-card surface —
 * the migration wizard's step grid and the save preview's sheet nav speak
 * the same visual language on purpose.
 */
export const SHEET_ICON: Record<SheetName, ReactNode> = {
  clients: <UsersIcon className={ICON_CLASS} aria-hidden="true" />,
  crm_notes: <ChatBubbleLeftRightIcon className={ICON_CLASS} aria-hidden="true" />,
  tags: <TagIcon className={ICON_CLASS} aria-hidden="true" />,
  tag_links: <LinkIcon className={ICON_CLASS} aria-hidden="true" />,
  jobs: <BriefcaseIcon className={ICON_CLASS} aria-hidden="true" />,
  pieces: <CubeIcon className={ICON_CLASS} aria-hidden="true" />,
  piece_items: <Squares2X2Icon className={ICON_CLASS} aria-hidden="true" />,
  inventory: <BuildingStorefrontIcon className={ICON_CLASS} aria-hidden="true" />,
  lots: <ArchiveBoxIcon className={ICON_CLASS} aria-hidden="true" />,
  transactions: <BanknotesIcon className={ICON_CLASS} aria-hidden="true" />,
  audit_log: <ClipboardDocumentListIcon className={ICON_CLASS} aria-hidden="true" />,
}

export const FALLBACK_SHEET_ICON = (
  <DocumentTextIcon className={ICON_CLASS} aria-hidden="true" />
)

/**
 * i18n key of each sheet's human label. The keys live under the wizard
 * namespace for historical reasons — the wizard named the sheets first.
 */
export const SHEET_LABEL_KEY: Record<SheetName, string> = {
  clients: 'wizard.migrationEntityClients',
  crm_notes: 'wizard.migrationEntityCrmNotes',
  tags: 'wizard.migrationEntityTags',
  tag_links: 'wizard.migrationEntityTagLinks',
  jobs: 'wizard.migrationEntityJobs',
  pieces: 'wizard.migrationEntityPieces',
  piece_items: 'wizard.migrationEntityPieceItems',
  inventory: 'wizard.migrationEntityInventory',
  lots: 'wizard.migrationEntityLots',
  transactions: 'wizard.migrationEntityTransactions',
  audit_log: 'wizard.migrationEntityAuditLog',
}
