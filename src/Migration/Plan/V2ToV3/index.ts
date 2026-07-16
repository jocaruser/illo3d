import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { ExtendInventoryStep } from './ExtendInventoryStep'
import { ExtendJobsStep } from './ExtendJobsStep'

/** v2 → v3: append `jobs.due_date` and `inventory.colour`. */
export const v2ToV3Plan: MigrationPlan = {
  fromMajor: 2,
  toMajor: 3,
  toVersion: '3.0.0',
  steps: [new ExtendJobsStep(), new ExtendInventoryStep()],
}
