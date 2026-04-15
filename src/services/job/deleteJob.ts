import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'
import type { Job, Piece, PieceItem } from '@/types/money'
import { deleteCrmNotesForEntity } from '@/services/crmNote/deleteCrmNotesForEntity'

export async function deleteJob(
  spreadsheetId: string,
  jobId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const jobs = await repo.readRows<Job>(spreadsheetId, 'jobs')
  const jobIdx = jobs.findIndex((j) => j.id === jobId)
  if (jobIdx === -1) {
    throw new Error(`Job ${jobId} not found`)
  }

  const pieces = await repo.readRows<Piece>(spreadsheetId, 'pieces')
  const pieceIndices: number[] = []
  const pieceIds = new Set<string>()
  pieces.forEach((p, i) => {
    if (p.job_id === jobId) {
      pieceIndices.push(i)
      pieceIds.add(p.id)
    }
  })

  const pieceItems = await repo.readRows<PieceItem>(
    spreadsheetId,
    'piece_items'
  )
  const itemIndices: number[] = []
  pieceItems.forEach((pi, i) => {
    if (pieceIds.has(pi.piece_id)) {
      itemIndices.push(i)
    }
  })

  for (const i of [...itemIndices].sort((a, b) => b - a)) {
    await repo.deleteRow(spreadsheetId, 'piece_items', i + 1)
  }
  for (const i of [...pieceIndices].sort((a, b) => b - a)) {
    await repo.deleteRow(spreadsheetId, 'pieces', i + 1)
  }

  await deleteCrmNotesForEntity(spreadsheetId, 'job', jobId)

  const tagLinks = await repo.readRows<{
    entity_type: string
    entity_id: string
  }>(spreadsheetId, 'tag_links' as SheetName)
  const tagLinkIndices = tagLinks.reduce<number[]>((acc, l, i) => {
    if (
      l.entity_type?.trim() === 'job' &&
      l.entity_id?.trim() === jobId
    ) {
      acc.push(i)
    }
    return acc
  }, [])
  for (const i of [...tagLinkIndices].sort((a, b) => b - a)) {
    await repo.deleteRow(spreadsheetId, 'tag_links' as SheetName, i + 1)
  }

  await repo.deleteRow(spreadsheetId, 'jobs', jobIdx + 1)
}
