import type { Tag, TagLink } from '@/types/money'
import { EntityTagsSection } from '@/components/EntityTagsSection'

interface JobTagsSectionProps {
  spreadsheetId: string | null
  jobId: string
  tags: Tag[]
  tagLinks: TagLink[]
  onChanged: () => Promise<void>
}

export function JobTagsSection({
  spreadsheetId,
  jobId,
  tags,
  tagLinks,
  onChanged,
}: JobTagsSectionProps) {
  return (
    <EntityTagsSection
      spreadsheetId={spreadsheetId}
      entityType="job"
      entityId={jobId}
      tags={tags}
      tagLinks={tagLinks}
      onChanged={onChanged}
      i18nScope="jobDetail"
      sectionTestId="job-tags-section"
      chipTestIdPrefix="job-tag"
      tagComboboxTestIdPrefix="job-tag"
    />
  )
}
