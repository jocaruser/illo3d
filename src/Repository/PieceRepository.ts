import { Piece } from '@/Entity/Piece'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class PieceRepository extends AbstractSheetRepository<Piece> {
  protected readonly sheet = 'pieces' as const
  protected readonly auditEntityName = 'piece' as const
  protected readonly idPrefix = 'P'

  protected hydrate(record: SheetRecord): Piece {
    return Piece.fromRecord(record)
  }

  findByJob(jobId: string): Piece[] {
    return this.findAll().filter((piece) => piece.jobId === jobId)
  }

  /** Pieces that count toward job pricing: everything not soft-deleted (archived counts). */
  findCountingByJob(jobId: string): Piece[] {
    return this.findByJob(jobId).filter((piece) => !piece.isDeleted())
  }
}
