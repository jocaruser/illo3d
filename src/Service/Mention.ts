/** Matches @-mentions of clients (@CL1), jobs (@J2) and pieces (@P3) in note bodies. */
export const MENTION_PATTERN = /@(CL\d+|J\d+|P\d+)/g

export type MentionKind = 'client' | 'job' | 'piece'

export interface MentionToken {
  /** The full match including the leading '@'. */
  raw: string
  /** Canonical entity id (prefix + digits, no '@'). */
  id: string
  kind: MentionKind
}

function mentionKind(id: string): MentionKind {
  if (id.startsWith('CL')) return 'client'
  if (id.startsWith('J')) return 'job'
  return 'piece'
}

export function parseMentionTokens(body: string): MentionToken[] {
  const pattern = new RegExp(MENTION_PATTERN.source, MENTION_PATTERN.flags)
  const tokens: MentionToken[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    tokens.push({ raw: match[0], id: match[1], kind: mentionKind(match[1]) })
  }
  return tokens
}

/** Space-separated unique canonical ids (no '@') for the `referenced_entity_ids` cell. */
export function referencedEntityIdsFromBody(body: string): string {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const token of parseMentionTokens(body)) {
    if (seen.has(token.id)) continue
    seen.add(token.id)
    ids.push(token.id)
  }
  return ids.join(' ')
}
