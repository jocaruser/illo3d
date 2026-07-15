import type { SheetName } from '@/services/sheets/config'
import type { MigrationContext } from '@/services/migration/MigrationContext'
import {
  MigrationStep,
  type ProgressReporter,
} from '@/services/migration/MigrationStep'

export class AddLifecycleColsStep extends MigrationStep {
  readonly id: string
  readonly label: string

  constructor(private readonly sheetName: SheetName) {
    super()
    this.id = sheetName
    this.label = sheetName
  }

  protected async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    report.update('wizard.migrationStepCheckingColumns')
    if (await this.hasCanonicalHeader(ctx, this.sheetName)) return
    report.update('wizard.migrationStepAddingColumns')
    await this.extendSheetToCanonicalColumns(ctx, this.sheetName)
  }
}
