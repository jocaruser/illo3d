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

export async function fetchPieces(spreadsheetId: string): Promise<Piece[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Piece>(
    spreadsheetId,
    'pieces' as SheetName
  )
  return rows
    .filter((r) => r.id)
    .map((r) => ({
      ...r,
      status: parsePieceStatus(r.status),
    }))
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
