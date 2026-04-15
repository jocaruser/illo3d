import type { Piece } from '@/types/money'

/** Matches @CL1, @J2, @P2, etc. Captures full entity id (prefix + digits). */
export const MENTION_ENTITY_ID_REGEX = /@(CL\d+|J\d+|P\d+)/g

export function parseMentionEntityIdsFromText(text: string): string[] {
  const re = new RegExp(
    MENTION_ENTITY_ID_REGEX.source,
    MENTION_ENTITY_ID_REGEX.flags
  )
  const seen = new Set<string>()
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const id = m[1]
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

export function formatReferencedEntityIdsCell(ids: string[]): string {
  return ids.join(' ')
}

export function parseReferencedEntityIdsCell(cell: string | undefined): string[] {
  if (cell == null || !String(cell).trim()) return []
  return String(cell)
    .trim()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function mentionHrefForEntityId(
  entityId: string,
  pieces?: readonly Pick<Piece, 'id' | 'job_id'>[]
): string | null {
  if (/^CL\d+$/.test(entityId)) return `/clients/${entityId}`
  if (/^J\d+$/.test(entityId)) return `/jobs/${entityId}`
  if (/^P\d+$/.test(entityId)) {
    const piece = pieces?.find((p) => p.id === entityId)
    return piece?.job_id
      ? `/jobs/${piece.job_id}#piece-${piece.id}`
      : null
  }
  return null
}

export type MentionSegment =
  | { kind: 'text'; value: string }
  | { kind: 'mention'; entityId: string }

export function segmentTextWithMentions(text: string): MentionSegment[] {
  const re = /@(CL\d+|J\d+|P\d+)/g
  const out: MentionSegment[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ kind: 'text', value: text.slice(last, m.index) })
    }
    out.push({ kind: 'mention', entityId: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    out.push({ kind: 'text', value: text.slice(last) })
  }
  if (out.length === 0) {
    out.push({ kind: 'text', value: text })
  }
  return out
}
