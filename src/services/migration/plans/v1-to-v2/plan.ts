import type { SheetName } from '@/services/sheets/config'
import type { MigrationPlan } from '@/services/migration/MigrationPlan'
import { AddLifecycleColsStep } from './steps/AddLifecycleColsStep'
import { CreateAuditLogSheetStep } from './steps/CreateAuditLogSheetStep'

// Order matches the migration wizard's step grid cards.
const LIFECYCLE_SHEETS: SheetName[] = [
  'clients',
  'crm_notes',
  'tags',
  'tag_links',
  'jobs',
  'pieces',
  'piece_items',
  'inventory',
  'lots',
  'transactions',
]

export const v1ToV2Plan: MigrationPlan = {
  fromMajor: 1,
  toMajor: 2,
  toVersion: '2.0.0',
  steps: [
    ...LIFECYCLE_SHEETS.map((sheetName) => new AddLifecycleColsStep(sheetName)),
    new CreateAuditLogSheetStep(),
  ],
}
