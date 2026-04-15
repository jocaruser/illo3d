import { getSheetsRepository } from '@/services/sheets/repository'
import type { ClientNote } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'
import { parseClientNoteSeverity } from './severity'

export async function fetchClientNotes(
  spreadsheetId: string
): Promise<ClientNote[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Record<string, string>>(
    spreadsheetId,
    'client_notes' as SheetName
  )
  const byId = new Map<string, ClientNote>()
  for (const r of rows) {
    if (!r.id?.trim() || !r.client_id?.trim()) continue
    const severity = parseClientNoteSeverity(r.severity)
    if (!severity) continue
    const note: ClientNote = {
      id: r.id.trim(),
      client_id: r.client_id.trim(),
      body: r.body?.trim() ?? '',
      severity,
      created_at: r.created_at?.trim() ?? '',
    }
    // If ids collide (e.g. fixture edits), prefer the latest created_at.
    const prev = byId.get(note.id)
    if (!prev || note.created_at >= prev.created_at) {
      byId.set(note.id, note)
    }
  }
  const out = Array.from(byId.values())
  return out.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
