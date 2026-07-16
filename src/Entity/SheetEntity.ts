/** A sheet row keyed by canonical header name. All cells are strings. */
export type SheetRecord = Record<string, string>

/** Case-insensitive lifecycle flag check: `"true"`, `"TRUE"`, `"True"` all count. */
export function isLifecycleTrue(value: string): boolean {
  return value.trim().toLowerCase() === 'true'
}

/** Parse a numeric cell. Returns undefined for blank or non-numeric content. */
export function parseNumericCell(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Serialize an optional number back to a cell ('' when unset). */
export function numericCell(value: number | undefined): string {
  return value === undefined ? '' : String(value)
}

/**
 * Base class for all workbook entities. Mirrors the shared lifecycle columns
 * (`archived`, `deleted`) and the active-row semantics used across the app.
 */
export abstract class SheetEntity {
  archived = ''
  deleted = ''

  isArchived(): boolean {
    return isLifecycleTrue(this.archived)
  }

  isDeleted(): boolean {
    return isLifecycleTrue(this.deleted)
  }

  /** Active = neither archived nor soft-deleted. Only active rows appear in lists/search. */
  isActive(): boolean {
    return !this.isArchived() && !this.isDeleted()
  }

  /** Map this entity back to a sheet row keyed by canonical header names. */
  abstract toRecord(): SheetRecord
}
