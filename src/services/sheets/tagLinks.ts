import { getSheetsRepository } from './repository'
import type { TagEntityType, TagLink } from '@/types/money'

function parseEntityType(raw: string | undefined): TagEntityType | null {
  const s = raw?.trim()
  if (s === 'client' || s === 'job') return s
  return null
}

export async function fetchTagLinks(spreadsheetId: string): Promise<TagLink[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Record<string, string>>(
    spreadsheetId,
    'audit_log'
  )
  const byId = new Map<string, TagLink>()
  for (const r of rows) {
    if (r.entity_name !== 'tag_link') continue

    if (r.action === 'delete' && r.before_json) {
      try {
        const before = JSON.parse(r.before_json) as Record<string, string>
        const id = before.id?.trim()
        if (id) byId.delete(id)
      } catch {
        continue
      }
      continue
    }

    if (!r.after_json) continue
    try {
      const data = JSON.parse(r.after_json) as Record<string, string>
      if (!data.id?.trim() || !data.tag_id?.trim()) continue
      const entity_type = parseEntityType(data.entity_type)
      if (!entity_type || !data.entity_id?.trim()) continue
      byId.set(data.id.trim(), {
        id: data.id.trim(),
        tag_id: data.tag_id.trim(),
        entity_type,
        entity_id: data.entity_id.trim(),
        created_at: data.created_at?.trim() ?? '',
      })
    } catch {
      continue
    }
  }
  return Array.from(byId.values())
}
