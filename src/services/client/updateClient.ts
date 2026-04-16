import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToClients } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

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
  void spreadsheetId
  const clients = matrixToClients(useWorkbookStore.getState().tabs.clients)
  const existing = clients.find((c) => c.id === clientId)
  if (!existing) {
    throw new Error(`Client ${clientId} not found`)
  }
  const row: Record<string, unknown> = {
    id: existing.id,
    name: payload.name.trim(),
    email: payload.email?.trim() ?? '',
    phone: payload.phone?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
    preferred_contact: payload.preferred_contact?.trim() ?? '',
    lead_source: payload.lead_source?.trim() ?? '',
    address: payload.address?.trim() ?? '',
    created_at: existing.created_at,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }

  patchWorkbookTab('clients', (m) =>
    updateDataRowById('clients', m, clientId, row),
  )
}
