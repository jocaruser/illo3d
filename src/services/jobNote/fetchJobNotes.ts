import { fetchCrmNotes } from '@/services/crmNote/fetchCrmNotes'
import type { JobNote } from '@/types/money'

export async function fetchJobNotes(spreadsheetId: string): Promise<JobNote[]> {
  const all = await fetchCrmNotes(spreadsheetId)
  const out = all
    .filter((n) => n.entity_type === 'job')
    .map(
      (n): JobNote => ({
        id: n.id,
        job_id: n.entity_id,
        body: n.body,
        referenced_entity_ids: n.referenced_entity_ids,
        severity: n.severity,
        created_at: n.created_at,
      })
    )
  return out.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
