import type { EntityType } from './appendHistoryRow'

/**
 * Creates a JSON snapshot of a row object for history auditing.
 * Returns a compact JSON string (sorted keys for consistency).
 */
export function snapshotRow(
  entityType: EntityType,
  row: Record<string, unknown>,
): string {
  // Sort keys for consistent serialization
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(row).sort()) {
    sorted[key] = row[key]
  }

  // Include entity type metadata in the snapshot
  const snapshot = {
    _entityType: entityType,
    _timestamp: new Date().toISOString(),
    data: sorted,
  }

  return JSON.stringify(snapshot)
}

/**
 * Helper to snapshot a row before mutation.
 * Returns the snapshot string for use with appendHistoryRow.
 */
export function snapshotRowBefore(
  entityType: EntityType,
  row: Record<string, unknown> | null | undefined,
): string {
  if (!row) {
    return JSON.stringify({ _entityType: entityType, _null: true })
  }
  return snapshotRow(entityType, row)
}

/**
 * Helper to snapshot a row after mutation.
 * Returns the snapshot string for use with appendHistoryRow.
 */
export function snapshotRowAfter(
  entityType: EntityType,
  row: Record<string, unknown>,
): string {
  return snapshotRow(entityType, row)
}
