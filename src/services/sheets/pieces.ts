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

export function parsePieceRow(r: Piece): Piece {
  const rawPrice = r.price as unknown
  let price: number | undefined
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
    const n =
      typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice)
    price = Number.isNaN(n) ? undefined : n
  }
  return {
    ...r,
    status: parsePieceStatus(r.status),
    price,
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
