import type { ComponentType, SVGProps } from 'react'
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

export type SheetIconComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * Icon and label per workbook sheet, shared by every sheet-card surface —
 * the migration wizard's step grid and the save preview's sheet nav speak
 * the same visual language on purpose. Icons are component references, not
 * elements: callers render them with their own sizing classes.
 */
export const SHEET_ICON: Record<SheetName, SheetIconComponent> = {
  clients: UsersIcon,
  crm_notes: ChatBubbleLeftRightIcon,
  tags: TagIcon,
  tag_links: LinkIcon,
  jobs: BriefcaseIcon,
  pieces: CubeIcon,
  piece_items: Squares2X2Icon,
  inventory: BuildingStorefrontIcon,
  lots: ArchiveBoxIcon,
  transactions: BanknotesIcon,
  audit_log: ClipboardDocumentListIcon,
}

export const FALLBACK_SHEET_ICON: SheetIconComponent = DocumentTextIcon

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
