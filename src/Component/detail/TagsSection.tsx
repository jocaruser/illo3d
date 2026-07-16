import { useMemo, useReducer } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { toast } from '@/Component/Toast'
import type { TaggableEntityType } from '@/Entity/TagLink'
import { useEntityManager } from '@/Hook/useEntityManager'
import { TagService } from '@/Service/TagService'

interface TagsSectionProps {
  entityType: TaggableEntityType
  entityId: string
}

/**
 * Tag chips for a client or job plus a creatable picker: choosing an existing
 * option links it, typing a new name creates the tag (`TagService` reuses names
 * case-insensitively, so "vip" links the existing "Vip").
 */
export function TagsSection({ entityType, entityId }: TagsSectionProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const prefix = entityType === 'client' ? 'clientDetail' : 'jobDetail'

  const service = useMemo(() => new TagService(em), [em])
  const tags = useMemo(
    () => service.listTagsForEntity(entityType, entityId),
    [service, entityType, entityId, revision]
  )

  /** Every active tag not already linked to this entity. */
  const options = useMemo<ComboboxItem[]>(() => {
    const linked = new Set(tags.map((tag) => tag.id))
    return em.tags
      .findActive()
      .filter((tag) => !linked.has(tag.id))
      .map((tag) => ({ key: tag.id, label: tag.name }))
  }, [em, tags])

  const addByName = (name: string) => {
    const result = service.addTagToEntity(entityType, entityId, name)
    if (!result.ok) {
      toast.error(t(result.error))
      return
    }
    toast.success(t('toast.saveSuccess'))
    bump()
  }

  const addByKey = (tagId: string) => {
    const tag = em.tags.find(tagId)
    if (tag !== null) addByName(tag.name)
  }

  const remove = (tagId: string) => {
    service.removeTagFromEntity(entityType, entityId, tagId)
    toast.success(t('toast.saveSuccess'))
    bump()
  }

  return (
    <section className="space-y-3" data-testid={`${entityType}-tags-section`}>
      <SectionHeading>{t(`${prefix}.tagsTitle`)}</SectionHeading>

      {tags.length === 0 ? (
        <p className="text-sm text-text-muted">{t(`${prefix}.tagsEmpty`)}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              data-testid={`${entityType}-tag-chip-${tag.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs text-text"
            >
              {tag.name}
              <button
                type="button"
                aria-label={`${t(`${prefix}.tagsRemove`)}: ${tag.name}`}
                className="rounded-full text-text-muted hover:text-danger"
                onClick={() => remove(tag.id)}
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-sm">
        <Combobox
          items={options}
          value={null}
          creatable
          placeholder={t(`${prefix}.tagsComboboxPlaceholder`)}
          onChange={addByKey}
          onCreateItem={addByName}
        />
      </div>
    </section>
  )
}
