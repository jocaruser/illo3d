/** Entities visible in global search (excludes archived / soft-deleted rows). */
export function excludeArchivedDeleted<
  T extends { archived?: string; deleted?: string },
>(items: T[]): T[] {
  return items.filter(
    (x) => x.archived !== 'true' && x.deleted !== 'true',
  )
}
