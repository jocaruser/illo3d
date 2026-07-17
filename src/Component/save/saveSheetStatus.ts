import type { SheetName } from '@/Config/schema'
import type { StepStatusConfig } from '@/Component/StepCard'

/**
 * Card status of one sheet in the save preview: what the pending diff says
 * while idle (`clean`/`changed`), what the writer says while a save runs or
 * after one fails (`saving`/`saved`/`failed`).
 */
export type SaveSheetStatus = 'clean' | 'changed' | 'saving' | 'saved' | 'failed'

export const SAVE_STATUS_STYLE: StepStatusConfig = {
  clean: {
    container: 'border-border bg-surface-alt text-text-muted',
    showCheckIcon: true,
  },
  changed: { container: 'border-primary/50 bg-primary/10 text-primary' },
  saving: { container: 'border-accent/50 bg-accent/10 text-accent' },
  saved: {
    container: 'border-success/50 bg-success/10 text-success',
    showCheckIcon: true,
  },
  failed: { container: 'border-danger/50 bg-danger/10 text-danger' },
}

/** The last (or current) save run as the stepper sees it. */
export interface SaveRun {
  doneSheets: string[]
  failedSheets: string[]
  /** True while the writes are still in flight. */
  active: boolean
}

/**
 * A run in progress (or a failed one left on screen) overrides the diff:
 * written sheets are green, failed ones red, the rest pulse while active.
 * With no run to show, the diff decides between changed and clean.
 */
export function saveSheetStatus(
  sheet: SheetName,
  hasChanges: boolean,
  run: SaveRun | null
): SaveSheetStatus {
  if (run !== null) {
    if (run.failedSheets.includes(sheet)) return 'failed'
    if (run.doneSheets.includes(sheet)) return 'saved'
    if (run.active) return 'saving'
  }
  return hasChanges ? 'changed' : 'clean'
}
