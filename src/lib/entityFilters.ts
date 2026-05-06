export function isActiveRow(row: { archived?: string; deleted?: string }): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

export function isActiveLot(lot: { archived?: string; deleted?: string }): boolean {
  return lot.archived !== 'true' && lot.deleted !== 'true'
}
