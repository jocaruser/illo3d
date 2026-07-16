import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { cx } from '@/Component/cx'
import { useEntityManager } from '@/Hook/useEntityManager'
import { globalSearch, type GlobalSearchHit } from '@/Service/Search/globalSearch'

const MIN_QUERY_LENGTH = 2

/**
 * Fuzzy search over the whole snapshot. Navigating from a hit changes the
 * route (and therefore the nav highlight) only through the hit's own target —
 * typing here never highlights a section on its own.
 */
export function GlobalSearchBox() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const em = useEntityManager()
  const id = useId()
  const listboxId = `${id}-listbox`
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)

  const hits = useMemo(() => globalSearch(em, query, t), [em, query, t])
  const expanded = open && query.trim().length >= MIN_QUERY_LENGTH

  const select = (hit: GlobalSearchHit): void => {
    setQuery('')
    setActiveIndex(-1)
    setOpen(false)
    void navigate(hit.navigateTo)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'Enter') {
      if (!expanded || hits.length === 0) return
      event.preventDefault()
      select(hits[activeIndex >= 0 ? activeIndex : 0])
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    if (!expanded || hits.length === 0) return
    event.preventDefault()
    setActiveIndex((current) =>
      event.key === 'ArrowDown'
        ? Math.min(current + 1, hits.length - 1)
        : Math.max(current - 1, 0)
    )
  }

  return (
    <div role="search" className="relative">
      <input
        type="search"
        role="combobox"
        data-testid="global-header-search"
        aria-label={t('globalSearch.ariaCombobox')}
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          expanded && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        className="w-40 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
        placeholder={t('globalSearch.placeholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(-1)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Escape closes the list without moving focus, so a click on the
        // already-focused input has to be able to bring it back.
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {expanded && (
        <ul
          id={listboxId}
          role="listbox"
          data-testid="global-search-listbox"
          aria-label={t('globalSearch.listLabel')}
          className="absolute right-0 z-40 mt-1 max-h-96 w-80 overflow-auto rounded-md border border-border bg-surface-elevated py-1 shadow-lg"
        >
          {hits.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-sm text-text-muted">
              {t('globalSearch.noResults')}
            </li>
          ) : (
            hits.map((hit, index) => (
              <li
                key={`${hit.kind}-${hit.id}`}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                data-testid={`global-search-option-${hit.kind}-${hit.id}`}
                className={cx(
                  'cursor-pointer px-3 py-2',
                  index === activeIndex && 'bg-primary/10'
                )}
                onMouseDown={(event) => {
                  // Keep focus so the blur handler cannot close the list first.
                  event.preventDefault()
                  select(hit)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="block text-xs uppercase tracking-wide text-text-muted">
                  {t(`globalSearch.kind.${hit.kind}`)}
                </span>
                <span className="block truncate text-sm text-text">{hit.primaryLine}</span>
                {hit.secondaryLine !== undefined && (
                  <span className="block truncate text-xs text-text-muted">
                    {hit.secondaryLine}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
