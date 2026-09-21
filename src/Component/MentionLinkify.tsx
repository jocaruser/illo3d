import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { EntityManager } from '@/Repository/EntityManager'
import { mentionTokenTarget } from '@/Service/Linking/entityLinkTargets'

interface MentionLinkifyProps {
  text: string
  em: EntityManager
}

/** Renders body text, turning @CL1 / @J2 / @P3 mentions into router links. */
export function MentionLinkify({ text, em }: MentionLinkifyProps) {
  const pattern = /@(CL|J|P)(\d+)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match = pattern.exec(text)
  while (match !== null) {
    const [token, kind, digits] = match
    const id = `${kind}${digits}`
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const target = mentionTokenTarget(em, kind as 'CL' | 'J' | 'P', id)
    if (target === null) {
      nodes.push(token)
    } else {
      nodes.push(
        <Link
          key={`${match.index}-${id}`}
          to={target}
          className="text-primary hover:underline"
        >
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
