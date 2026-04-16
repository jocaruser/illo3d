import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToClients } from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface CreateClientPayload {
  name: string
  email?: string
  phone?: string
  notes?: string
  preferred_contact?: string
  lead_source?: string
  address?: string
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createClient(
  spreadsheetId: string,
  payload: CreateClientPayload
): Promise<void> {
  void spreadsheetId
  const clients = matrixToClients(useWorkbookStore.getState().tabs.clients)
  const clientId = nextNumericId(
    'CL',
    clients.map((c) => c.id).filter((id): id is string => id != null),
  )

  const row = {
    id: clientId,
    name: payload.name.trim(),
    email: payload.email?.trim() ?? '',
    phone: payload.phone?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
    preferred_contact: payload.preferred_contact?.trim() ?? '',
    lead_source: payload.lead_source?.trim() ?? '',
    address: payload.address?.trim() ?? '',
    created_at: todayIsoDate(),
    archived: '',
    deleted: '',
  }

  patchWorkbookTab('clients', (m) => appendDataRow('clients', m, row))
}
