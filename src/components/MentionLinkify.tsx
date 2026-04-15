import { Link } from 'react-router-dom'
import type { Client, Job, Piece } from '@/types/money'
import {
  mentionHrefForEntityId,
  segmentTextWithMentions,
} from '@/utils/mentionTokens'

export interface MentionLinkifyProps {
  text: string
  clients?: Client[]
  jobs?: Job[]
  pieces?: Piece[]
  className?: string
}

function labelForEntityId(
  entityId: string,
  clients: Client[] | undefined,
  jobs: Job[] | undefined,
  pieces: Piece[] | undefined
): string {
  if (entityId.startsWith('CL')) {
    const c = clients?.find((x) => x.id === entityId)
    if (c?.name?.trim()) return c.name.trim()
  }
  if (entityId.startsWith('J')) {
    const j = jobs?.find((x) => x.id === entityId)
    if (j?.description?.trim()) return j.description.trim()
  }
  if (entityId.startsWith('P')) {
    const p = pieces?.find((x) => x.id === entityId)
    if (p?.name?.trim()) return p.name.trim()
  }
  return entityId
}

export function MentionLinkify({
  text,
  clients,
  jobs,
  pieces,
  className,
}: MentionLinkifyProps) {
  const segments = segmentTextWithMentions(text)
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <span key={i}>{seg.value}</span>
        }
        const href = mentionHrefForEntityId(seg.entityId, pieces)
        const label = labelForEntityId(seg.entityId, clients, jobs, pieces)
        if (!href) {
          return <span key={i}>{seg.entityId}</span>
        }
        return (
          <Link
            key={i}
            to={href}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {label}
          </Link>
        )
      })}
    </span>
  )
}
