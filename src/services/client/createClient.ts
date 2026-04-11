import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { SheetName } from '@/services/sheets/config'

export interface CreateClientPayload {
  name: string
  email?: string
  phone?: string
  notes?: string
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createClient(
  spreadsheetId: string,
  payload: CreateClientPayload
): Promise<void> {
  const repo = getSheetsRepository()
  const clients = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'clients' as SheetName
  )
  const clientId = nextNumericId(
    'CL',
    clients.map((c) => c.id).filter((id): id is string => id != null)
  )

  const row = {
    id: clientId,
    name: payload.name.trim(),
    email: payload.email?.trim() ?? '',
    phone: payload.phone?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
    created_at: todayIsoDate(),
  }

  await repo.appendRows(spreadsheetId, 'clients' as SheetName, [row])
}
