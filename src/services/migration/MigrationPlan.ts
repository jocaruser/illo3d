import type { MigrationStep } from './MigrationStep'

export interface MigrationPlan {
  fromMajor: number
  toMajor: number
  /** Full semver written to shop metadata at commit time. */
  toVersion: string
  steps: MigrationStep[]
}
