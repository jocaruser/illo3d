export function isActiveRow(row: { archived?: string; deleted?: string }): boolean {
  return String(row.archived).toLowerCase() !== 'true' && String(row.deleted).toLowerCase() !== 'true'
}

export function isActiveLot(lot: { archived?: string; deleted?: string }): boolean {
  return String(lot.archived).toLowerCase() !== 'true' && String(lot.deleted).toLowerCase() !== 'true'
}
