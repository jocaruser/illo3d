import type { MigrationStep } from './MigrationStep'

/**
 * One declarative hop of the migration chain (think a Doctrine migration
 * class): an ordered list of idempotent steps that lift a shop from one major
 * version to the next. Plans are chained by the registry.
 */
export interface MigrationPlan {
  fromMajor: number
  toMajor: number
  /** Full semver written to `illo3d.metadata.json` when this is the last plan. */
  toVersion: string
  steps: MigrationStep[]
}
