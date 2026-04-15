import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'
import type { CrmNote, CrmNoteEntityType } from '@/types/money'
import { parseClientNoteSeverity } from '@/services/clientNote/severity'

function parseEntityType(raw: string | undefined): CrmNoteEntityType | null {
  const t = raw?.trim()
  if (t === 'client' || t === 'job') return t
  return null
}

export async function fetchCrmNotes(spreadsheetId: string): Promise<CrmNote[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Record<string, string>>(
    spreadsheetId,
    'crm_notes' as SheetName
  )
  const byId = new Map<string, CrmNote>()
  for (const r of rows) {
    const entityType = parseEntityType(r.entity_type)
    if (!entityType || !r.id?.trim() || !r.entity_id?.trim()) continue
    const severity = parseClientNoteSeverity(r.severity)
    if (!severity) continue
    const note: CrmNote = {
      id: r.id.trim(),
      entity_type: entityType,
      entity_id: r.entity_id.trim(),
      body: r.body?.trim() ?? '',
      referenced_entity_ids: r.referenced_entity_ids?.trim() ?? '',
      severity,
      created_at: r.created_at?.trim() ?? '',
    }
    const prev = byId.get(note.id)
    if (!prev || note.created_at >= prev.created_at) {
      byId.set(note.id, note)
    }
  }
  const out = Array.from(byId.values())
  return out.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
