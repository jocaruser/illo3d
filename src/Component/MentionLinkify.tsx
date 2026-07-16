import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface MentionLinkifyProps {
  text: string
  /** Maps a piece id (e.g. 'P3') to its job id, or null when unresolvable. */
  resolvePieceJob: (pieceId: string) => string | null
}

function mentionTarget(
  kind: string,
  id: string,
  resolvePieceJob: (pieceId: string) => string | null
): string | null {
  if (kind === 'CL') return `/clients/${id}`
  if (kind === 'J') return `/jobs/${id}`
  const jobId = resolvePieceJob(id)
  return jobId === null ? null : `/jobs/${jobId}#piece-${id}`
}

/** Renders body text, turning @CL1 / @J2 / @P3 mentions into router links. */
export function MentionLinkify({ text, resolvePieceJob }: MentionLinkifyProps) {
  const pattern = /@(CL|J|P)(\d+)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match = pattern.exec(text)
  while (match !== null) {
    const [token, kind, digits] = match
    const id = `${kind}${digits}`
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const target = mentionTarget(kind, id, resolvePieceJob)
    if (target === null) {
      nodes.push(token)
    } else {
      nodes.push(
        <Link key={`${match.index}-${id}`} to={target} className="text-primary hover:underline">
          {token}
        </Link>
      )
    }
    lastIndex = match.index + token.length
    match = pattern.exec(text)
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return <>{nodes}</>
}
