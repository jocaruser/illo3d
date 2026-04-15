import { getSheetsRepository } from '@/services/sheets/repository'
import type { Client } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'

export interface UpdateClientPayload {
  name: string
  email?: string
  phone?: string
  notes?: string
  preferred_contact?: string
  lead_source?: string
  address?: string
}

export async function updateClient(
  spreadsheetId: string,
  clientId: string,
  payload: UpdateClientPayload
): Promise<void> {
  const repo = getSheetsRepository()
  const clients = await repo.readRows<Client>(
    spreadsheetId,
    'clients' as SheetName
  )
  const idx = clients.findIndex((c) => c.id === clientId)
  if (idx === -1) {
    throw new Error(`Client ${clientId} not found`)
  }
  const existing = clients[idx]
  const row = {
    id: existing.id,
    name: payload.name.trim(),
    email: payload.email?.trim() ?? '',
    phone: payload.phone?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
    preferred_contact: payload.preferred_contact?.trim() ?? '',
    lead_source: payload.lead_source?.trim() ?? '',
    address: payload.address?.trim() ?? '',
    created_at: existing.created_at,
  }
  await repo.updateRow(spreadsheetId, 'clients' as SheetName, idx + 1, row)
}
