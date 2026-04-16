import { getSheetsRepository } from './repository'
import type { Job } from '@/types/money'
import type { SheetName } from './config'

export function parseJobRow(r: Job): Job {
  const rawPrice = r.price as unknown
  let price: number | undefined
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
    const n =
      typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice)
    price = Number.isNaN(n) ? undefined : n
  }
  return {
    ...r,
    price,
  }
}

export async function fetchJobs(spreadsheetId: string): Promise<Job[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Job>(
    spreadsheetId,
    'jobs' as SheetName
  )
  return rows
    .filter((r) => r.id)
    .map(parseJobRow)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
