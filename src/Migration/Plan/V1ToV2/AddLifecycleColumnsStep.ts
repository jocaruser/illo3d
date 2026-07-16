import type { SheetName } from '@/Config/schema'
import type { MigrationContext } from '@/Migration/MigrationContext'
import { MigrationStep, type ProgressReporter } from '@/Migration/MigrationStep'

/**
 * v1 → v2: append the lifecycle columns (`archived`, `deleted`) to one data
 * sheet.
 *
 * Deliberate choice: this step extends to the **current canonical (v3)**
 * header, not a frozen v2 shape. A v1 shop therefore gains the lifecycle
 * columns AND the v3 additions (`jobs.due_date`, `inventory.colour`) in one
 * rewrite, and the V2ToV3 steps become idempotent no-ops on chained v1 → v3
 * runs. Values for the new columns are '' (nullable), so this is safe.
 */
export class AddLifecycleColumnsStep extends MigrationStep {
  readonly id: string

  constructor(private readonly sheet: SheetName) {
    super()
    this.id = sheet
  }

  async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    report.update('wizard.migrationStepColumns')
    if (await this.hasCanonicalHeader(ctx, this.sheet)) return
    await this.extendSheetToCanonicalColumns(ctx, this.sheet)
  }
}
