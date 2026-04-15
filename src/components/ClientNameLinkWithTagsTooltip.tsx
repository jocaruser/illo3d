import { LinkWithTagsTooltip } from '@/components/LinkWithTagsTooltip'

export interface ClientNameLinkWithTagsTooltipProps {
  clientId: string
  name: string
  /** Comma-separated tag labels (same shape as `tagTitleByClientId` values). */
  tagLine?: string
}

export function ClientNameLinkWithTagsTooltip({
  clientId,
  name,
  tagLine,
}: ClientNameLinkWithTagsTooltipProps) {
  return (
    <LinkWithTagsTooltip
      to={`/clients/${clientId}`}
      label={name}
      tagLine={tagLine}
      dataTestid={`client-detail-link-${clientId}`}
    />
  )
}
