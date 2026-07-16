/**
 * Prefixed auto-increment ids, matching the historic workbook conventions:
 * CL (client), CN/JN (client/job note), TG (tag), TL (tag link), J (job),
 * P (piece), PI (piece item), INV (inventory), L (lot), T (transaction),
 * AL (audit entry).
 *
 * Next id = highest existing numeric suffix for the prefix + 1.
 */
export function nextId(prefix: string, existingIds: readonly string[]): string {
  let highest = 0
  const pattern = new RegExp(`^${prefix}(\\d+)$`)
  for (const id of existingIds) {
    const match = pattern.exec(id.trim())
    if (!match) continue
    const value = Number(match[1])
    if (value > highest) highest = value
  }
  return `${prefix}${highest + 1}`
}
