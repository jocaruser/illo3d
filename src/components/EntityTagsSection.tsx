import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tag, TagEntityType, TagLink } from '@/types/money'
import { createTag } from '@/services/tag/createTag'
import { createTagLink } from '@/services/tag/createTagLink'
import { deleteTagLink } from '@/services/tag/deleteTagLink'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import type { TagCommitPayload } from '@/utils/tagNameMatch'
import type { TagsTranslationScope } from './TagAddCombobox'
import { TagAddCombobox } from './TagAddCombobox'

export interface EntityTagsSectionProps {
  spreadsheetId: string | null
  entityType: TagEntityType
  entityId: string
  tags: Tag[]
  tagLinks: TagLink[]
  onChanged: () => Promise<void>
  i18nScope: TagsTranslationScope
  sectionTestId: string
  chipTestIdPrefix: string
  tagComboboxTestIdPrefix: string
}

export function EntityTagsSection({
  spreadsheetId,
  entityType,
  entityId,
  tags,
  tagLinks,
  onChanged,
  i18nScope,
  sectionTestId,
  chipTestIdPrefix,
  tagComboboxTestIdPrefix,
}: EntityTagsSectionProps) {
  const { t } = useTranslation()
  const tk = (key: string) => t(`${i18nScope}.${key}`)

  const linksForEntity = tagLinks.filter(
    (l) => l.entity_type === entityType && l.entity_id === entityId,
  )
  const linkedTagIds = new Set(linksForEntity.map((l) => l.tag_id))
  const availableToLink = tags.filter((tag) => !linkedTagIds.has(tag.id))

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCommitTag = async (payload: TagCommitPayload) => {
    if (!spreadsheetId) return
    setBusy(true)
    setError(null)
    try {
      if (payload.type === 'link') {
        await createTagLink(
          spreadsheetId,
          payload.tagId,
          entityType,
          entityId,
        )
      } else {
        const tagId = await createTag(spreadsheetId, payload.name)
        await createTagLink(spreadsheetId, tagId, entityType, entityId)
      }
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (linkId: string) => {
    if (!spreadsheetId) return
    setBusy(true)
    setError(null)
    try {
      await deleteTagLink(spreadsheetId, linkId)
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-8" data-testid={sectionTestId}>
      <h3 className="mb-3 text-xl font-semibold text-gray-800">
        {tk('tagsTitle')}
      </h3>
      {error ? (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mb-3 flex flex-wrap gap-2">
        {linksForEntity.length === 0 ? (
          <p className="text-sm text-gray-500">{tk('tagsEmpty')}</p>
        ) : (
          linksForEntity.map((link) => {
            const tag = tags.find((x) => x.id === link.tag_id)
            const rawName = tag?.name?.trim()
            const label = rawName
              ? formatTagNameTitleCase(rawName)
              : link.tag_id
            return (
              <span
                key={link.id}
                data-testid={`${chipTestIdPrefix}-chip-${link.tag_id}`}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800"
              >
                {label}
                <button
                  type="button"
                  disabled={busy || !spreadsheetId}
                  data-testid={`${chipTestIdPrefix}-remove-${link.id}`}
                  onClick={() => void handleRemove(link.id)}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  aria-label={tk('tagsRemove')}
                >
                  ×
                </button>
              </span>
            )
          })
        )}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
        <TagAddCombobox
          allTags={tags}
          suggestionTags={availableToLink}
          disabled={!spreadsheetId}
          busy={busy}
          onCommit={handleCommitTag}
          testIdPrefix={tagComboboxTestIdPrefix}
          tagsTranslationScope={i18nScope}
        />
      </div>
    </div>
  )
}
