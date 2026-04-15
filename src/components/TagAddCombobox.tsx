import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tag } from '@/types/money'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import {
  filterTagsByNameSubstring,
  resolveTagCommitFromInput,
  type TagCommitPayload,
} from '@/utils/tagNameMatch'

export type TagsTranslationScope = 'clientDetail' | 'jobDetail'

export interface TagAddComboboxProps {
  allTags: Tag[]
  suggestionTags: Tag[]
  disabled?: boolean
  busy?: boolean
  onCommit: (payload: TagCommitPayload) => Promise<void>
  /** Prefix for `data-testid` values (e.g. `client-tag`, `job-tag`). */
  testIdPrefix?: string
  /** i18n namespace for tag combobox strings. */
  tagsTranslationScope?: TagsTranslationScope
}

export function TagAddCombobox({
  allTags,
  suggestionTags,
  disabled = false,
  busy = false,
  onCommit,
  testIdPrefix = 'client-tag',
  tagsTranslationScope = 'clientDetail',
}: TagAddComboboxProps) {
  const { t } = useTranslation()
  const tk = (key: string) => t(`${tagsTranslationScope}.${key}`)
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () => filterTagsByNameSubstring(suggestionTags, query),
    [suggestionTags, query],
  )

  const commitPayload = useCallback(
    async (payload: TagCommitPayload | null) => {
      if (!payload) return
      await onCommit(payload)
      setQuery('')
      setOpen(false)
      setActiveIdx(-1)
    },
    [onCommit],
  )

  const commitFromInput = useCallback(async () => {
    const payload = resolveTagCommitFromInput(allTags, query)
    await commitPayload(payload)
  }, [allTags, query, commitPayload])

  const commitLink = useCallback(
    async (tagId: string) => {
      await commitPayload({ type: 'link', tagId })
    },
    [commitPayload],
  )

  const handleFocusInput = () => {
    if (suggestionTags.length > 0) {
      setOpen(true)
      setActiveIdx(-1)
    }
  }

  const handleBlurInput = () => {
    requestAnimationFrame(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open && suggestionTags.length > 0) {
        setOpen(true)
      }
      if (filtered.length === 0) return
      setActiveIdx((i) => (i + 1 >= filtered.length ? 0 : i + 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open && suggestionTags.length > 0) {
        setOpen(true)
      }
      if (filtered.length === 0) return
      setActiveIdx((i) => (i <= 0 ? filtered.length - 1 : i - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && activeIdx >= 0 && activeIdx < filtered.length) {
        void commitLink(filtered[activeIdx].id)
        return
      }
      void commitFromInput()
    }
  }

  const inputDisabled = disabled || busy
  const canSubmit = !inputDisabled && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {tk('tagsComboboxLabel')}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIdx >= 0
              ? `${baseId}-option-${filtered[activeIdx]?.id}`
              : undefined
          }
          data-testid={`${testIdPrefix}-add-input`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (suggestionTags.length > 0) {
              setOpen(true)
            }
            setActiveIdx(-1)
          }}
          onFocus={handleFocusInput}
          onBlur={handleBlurInput}
          onKeyDown={handleKeyDown}
          disabled={inputDisabled}
          placeholder={tk('tagsComboboxPlaceholder')}
          className="min-w-[10rem] flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          data-testid={`${testIdPrefix}-add-submit`}
          disabled={!canSubmit}
          onClick={() => void commitFromInput()}
          className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
        >
          {tk('tagsComboboxAdd')}
        </button>
      </div>
      {open && suggestionTags.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={tk('tagsComboboxListAria')}
          data-testid={`${testIdPrefix}-add-listbox`}
          className="absolute z-20 mt-1 max-h-48 w-full min-w-[12rem] overflow-y-auto rounded border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500" role="presentation">
              {tk('tagsComboboxNoMatch')}
            </li>
          ) : (
            filtered.map((tag, idx) => (
              <li
                key={tag.id}
                id={`${baseId}-option-${tag.id}`}
                role="option"
                aria-selected={idx === activeIdx}
                data-testid={`${testIdPrefix}-add-option-${tag.id}`}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  idx === activeIdx ? 'bg-blue-50 text-blue-900' : 'text-gray-800'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => void commitLink(tag.id)}
              >
                {formatTagNameTitleCase(tag.name)}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
