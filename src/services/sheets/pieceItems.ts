import { getSheetsRepository } from './repository'
import type { PieceItem } from '@/types/money'
import type { SheetName } from './config'

function parseQuantity(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return Number(value)
}

export async function fetchPieceItems(
  spreadsheetId: string
): Promise<PieceItem[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<PieceItem>(
    spreadsheetId,
    'piece_items' as SheetName
  )
  return rows
    .filter((r) => r.id && r.piece_id && r.inventory_id)
    .map((r) => ({
      ...r,
      quantity: parseQuantity(r.quantity),
    }))
    .sort((a, b) => {
      const byPiece = a.piece_id.localeCompare(b.piece_id)
      if (byPiece !== 0) return byPiece
      return a.id.localeCompare(b.id)
    })
}
