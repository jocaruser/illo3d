import type { DueDateBand } from '@/Service/Pricing/dueDate'

/**
 * Due-date badge styling per band. Shared by the kanban cards and the
 * calendar chips so one job reads the same urgency in both views.
 * There is no yellow token: the mild band is a lighter wash of warning.
 */
export const dueBandClasses: Record<DueDateBand, string> = {
  red: 'border-danger/40 bg-danger/10 text-danger',
  orange: 'border-warning/40 bg-warning/10 text-warning',
  yellow: 'border-warning/30 bg-warning/5 text-warning',
  none: 'border-border bg-surface-alt text-text-muted',
}
