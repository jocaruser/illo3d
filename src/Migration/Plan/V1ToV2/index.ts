import { DATA_SHEET_NAMES } from '@/Config/schema'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { AddLifecycleColumnsStep } from './AddLifecycleColumnsStep'
import { CreateAuditLogSheetStep } from './CreateAuditLogSheetStep'

/**
 * v1 → v2: add the lifecycle columns to every data sheet, then create and
 * backfill the audit log. `audit_log` runs last so the baseline snapshots see
 * the already-extended rows.
 */
export const v1ToV2Plan: MigrationPlan = {
  fromMajor: 1,
  toMajor: 2,
  toVersion: '2.0.0',
  steps: [
    ...DATA_SHEET_NAMES.map((sheet) => new AddLifecycleColumnsStep(sheet)),
    new CreateAuditLogSheetStep(),
  ],
}
