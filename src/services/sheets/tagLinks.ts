import { getSheetsRepository } from './repository'
import type { TagEntityType, TagLink } from '@/types/money'
import type { SheetName } from './config'

function parseEntityType(raw: string | undefined): TagEntityType | null {
  const s = raw?.trim()
  if (s === 'client' || s === 'job') return s
  return null
}

export async function fetchTagLinks(spreadsheetId: string): Promise<TagLink[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Record<string, string>>(
    spreadsheetId,
    'tag_links' as SheetName
  )
  const out: TagLink[] = []
  for (const r of rows) {
    if (!r.id?.trim() || !r.tag_id?.trim()) continue
    const entity_type = parseEntityType(r.entity_type)
    if (!entity_type || !r.entity_id?.trim()) continue
    out.push({
      id: r.id.trim(),
      tag_id: r.tag_id.trim(),
      entity_type,
      entity_id: r.entity_id.trim(),
      created_at: r.created_at?.trim() ?? '',
    })
  }
  return out
}
