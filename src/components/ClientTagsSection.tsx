import type { Tag, TagLink } from '@/types/money'
import { EntityTagsSection } from '@/components/EntityTagsSection'

interface ClientTagsSectionProps {
  spreadsheetId: string | null
  clientId: string
  tags: Tag[]
  tagLinks: TagLink[]
  onChanged: () => Promise<void>
}

export function ClientTagsSection({
  spreadsheetId,
  clientId,
  tags,
  tagLinks,
  onChanged,
}: ClientTagsSectionProps) {
  return (
    <EntityTagsSection
      spreadsheetId={spreadsheetId}
      entityType="client"
      entityId={clientId}
      tags={tags}
      tagLinks={tagLinks}
      onChanged={onChanged}
      i18nScope="clientDetail"
      sectionTestId="client-tags-section"
      chipTestIdPrefix="client-tag"
      tagComboboxTestIdPrefix="client-tag"
    />
  )
}
