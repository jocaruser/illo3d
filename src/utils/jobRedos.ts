import type { Inventory } from '@/types/money'

export interface RedoResult {
  redos: number
  band: 'safe' | 'tight' | 'risky'
}

/** Compute redos for a single inventory + quantity pair. */
export function computeRedos(
  inventory: Inventory | undefined,
  quantity: number,
): RedoResult {
  if (!inventory) {
    return { redos: 0, band: 'risky' }
  }
  const qty = inventory.qty_current
  const q = quantity > 0 ? quantity : 1
  const redos = Math.max(0, Math.floor((qty - q) / q))
  if (redos >= 2) return { redos, band: 'safe' }
  if (redos === 1) return { redos, band: 'tight' }
  return { redos, band: 'risky' }
}

/** Compute minimum redos across all filament inventories. */
export function jobMinimumRedos(
  inventoryRows: Inventory[],
  filamentQuantities: Map<string, number>,
): { minRedos: number; inventoryName: string } | null {
  let minRedos = Number.POSITIVE_INFINITY
  let inventoryName = ''

  for (const [inventoryId, quantity] of filamentQuantities) {
    const inv = inventoryRows.find((i) => i.id === inventoryId)
    if (!inv || inv.type !== 'filament') continue
    const { redos } = computeRedos(inv, quantity)
    if (redos < minRedos) {
      minRedos = redos
      inventoryName = inv.name
    }
  }

  if (minRedos === Number.POSITIVE_INFINITY) return null
  return { minRedos, inventoryName }
}
