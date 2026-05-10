import { getSheetsRepository } from './repository'
import type { Piece } from '@/types/money'
import type { SheetName } from './config'

function parsePieceUnits(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined
  const n =
    typeof raw === 'string' ? parseInt(raw, 10) : Math.trunc(Number(raw))
  if (!Number.isFinite(n) || n < 1) return undefined
  return n
}

function parseBoardOrder(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined
  const n =
    typeof raw === 'string' ? parseFloat(raw) : Number(raw)
  if (!Number.isFinite(n)) return undefined
  return Math.trunc(n)
}

export function parsePieceRow(r: Piece): Piece {
  const rawPrice = r.price as unknown
  let price: number | undefined
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
    const n =
      typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice)
    price = Number.isNaN(n) ? undefined : n
  }
  const units = parsePieceUnits((r as unknown as Record<string, unknown>).units)
  const board_order = parseBoardOrder((r as unknown as Record<string, unknown>).board_order)
  return {
    ...r,
    price,
    units,
    board_order,
  }
}

export async function fetchPieces(spreadsheetId: string): Promise<Piece[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Piece>(
    spreadsheetId,
    'pieces' as SheetName
  )
  return rows
    .filter((r) => r.id)
    .map(parsePieceRow)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}