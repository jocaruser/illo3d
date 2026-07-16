import type { MigrationContext } from '@/Migration/MigrationContext'
import { MigrationStep, type ProgressReporter } from '@/Migration/MigrationStep'

/** v2 → v3: append the nullable `colour` column to `inventory`. Idempotent. */
export class ExtendInventoryStep extends MigrationStep {
  readonly id = 'inventory'

  async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    report.update('wizard.migrationStepInventoryColour')
    if (await this.hasCanonicalHeader(ctx, 'inventory')) return
    await this.extendSheetToCanonicalColumns(ctx, 'inventory')
  }
}
