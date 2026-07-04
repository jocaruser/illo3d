import { getSheetsRepository } from '@/services/sheets/repository'
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
    'audit_log'
  )
  const byId = new Map<string, CrmNote>()
  for (const r of rows) {
    if (r.entity_name !== 'crm_note') continue
    const afterJson = r.after_json
    if (!afterJson) continue
    try {
      const data = JSON.parse(afterJson) as Record<string, string>
      const entityType = parseEntityType(data.entity_type)
      if (!entityType || !data.id?.trim() || !data.entity_id?.trim()) continue
      const severity = parseClientNoteSeverity(data.severity)
      if (!severity) continue
      const note: CrmNote = {
        id: data.id.trim(),
        entity_type: entityType,
        entity_id: data.entity_id.trim(),
        body: data.body?.trim() ?? '',
        referenced_entity_ids: data.referenced_entity_ids?.trim() ?? '',
        severity,
        created_at: data.created_at?.trim() ?? '',
      }
      const prev = byId.get(note.id)
      if (!prev || note.created_at >= prev.created_at) {
        byId.set(note.id, note)
      }
    } catch {
      continue
    }
  }
  const out = Array.from(byId.values())
  return out.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
