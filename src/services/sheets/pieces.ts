import { getSheetsRepository } from './repository'
import type { Piece, PieceStatus } from '@/types/money'
import type { SheetName } from './config'

const PIECE_STATUSES: PieceStatus[] = ['pending', 'done', 'failed']

function parsePieceStatus(value: unknown): PieceStatus {
  if (typeof value === 'string' && PIECE_STATUSES.includes(value as PieceStatus)) {
    return value as PieceStatus
  }
  return 'pending'
}

function parsePieceUnits(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined
  const n =
    typeof raw === 'string' ? parseInt(raw, 10) : Math.trunc(Number(raw))
  if (!Number.isFinite(n) || n < 1) return undefined
  return n
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
  return {
    ...r,
    status: parsePieceStatus(r.status),
    price,
    units,
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
