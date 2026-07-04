import { auditDelete } from '@/services/audit/auditEventEmitter'
import { getTagLinkById } from '@/services/audit/reconstruct'

export async function deleteTagLink(
  spreadsheetId: string,
  linkId: string
): Promise<void> {
  void spreadsheetId
  const existing = getTagLinkById(linkId)
  if (!existing) {
    throw new Error(`Tag link ${linkId} not found`)
  }
  auditDelete('tag_link', linkId, existing)
}
