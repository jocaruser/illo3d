import { getSheetsRepository } from '@/services/sheets/repository'
import type { Client } from '@/types/money'
import type { Job } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'
import { deleteCrmNotesForEntity } from '@/services/crmNote/deleteCrmNotesForEntity'

export const CLIENT_DELETE_BLOCKED_JOBS = 'CLIENT_DELETE_BLOCKED_JOBS'

export async function deleteClient(
  spreadsheetId: string,
  clientId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const jobs = await repo.readRows<Job>(spreadsheetId, 'jobs' as SheetName)
  if (jobs.some((j) => j.client_id === clientId)) {
    throw new Error(CLIENT_DELETE_BLOCKED_JOBS)
  }
  const clients = await repo.readRows<Client>(
    spreadsheetId,
    'clients' as SheetName
  )
  const idx = clients.findIndex((c) => c.id === clientId)
  if (idx === -1) {
    throw new Error(`Client ${clientId} not found`)
  }
  await deleteCrmNotesForEntity(spreadsheetId, 'client', clientId)
  await repo.deleteRow(spreadsheetId, 'clients' as SheetName, idx + 1)
}
