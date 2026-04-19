import type { Piece, PieceItem } from '@/types/money'

/** Positive integer count of units for this piece line, or null if unset / invalid. */
export function pieceUnitsResolved(piece: Piece): number | null {
  const u = piece.units
  if (typeof u !== 'number' || !Number.isInteger(u) || u < 1) return null
  return u
}

export function pieceUnitsAreSet(piece: Piece): boolean {
  return pieceUnitsResolved(piece) != null
}


/** Sum of (line quantity × units) per inventory id for stock checks and decrement. */
export function effectiveNeedByInventory(
  piece: Piece,
  lines: PieceItem[],
): Map<string, number> {
  const u = pieceUnitsResolved(piece)
  const m = new Map<string, number>()
  if (u == null) return m
  for (const line of lines) {
    if (line.archived === 'true' || line.deleted === 'true') continue
    const q =
      typeof line.quantity === 'number' ? line.quantity : Number(line.quantity)
    if (!Number.isFinite(q)) continue
    const invId = line.inventory_id
    m.set(invId, (m.get(invId) ?? 0) + q * u)
  }
  return m
}
