import type { MigrationContext } from '@/Migration/MigrationContext'
import { MigrationStep, type ProgressReporter } from '@/Migration/MigrationStep'

/** v2 → v3: append the nullable `due_date` column to `jobs`. Idempotent. */
export class ExtendJobsStep extends MigrationStep {
  readonly id = 'jobs'

  async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    report.update('wizard.migrationStepJobsDueDate')
    if (await this.hasCanonicalHeader(ctx, 'jobs')) return
    await this.extendSheetToCanonicalColumns(ctx, 'jobs')
  }
}
