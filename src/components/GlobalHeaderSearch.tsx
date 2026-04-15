import { useId, useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '@/stores/shopStore'
import { useClients } from '@/hooks/useClients'
import { useJobs } from '@/hooks/useJobs'
import { usePieces } from '@/hooks/usePieces'
import { useCrmNotes } from '@/hooks/useCrmNotes'
import { useTransactions } from '@/hooks/useTransactions'
import { useExpenses } from '@/hooks/useExpenses'
import { useInventory } from '@/hooks/useInventory'
import { useTags } from '@/hooks/useTags'
import { useTagLinks } from '@/hooks/useTagLinks'
import { buildGlobalSearchRows } from '@/lib/globalSearch/buildRows'
import { selectGlobalSearchResults } from '@/lib/globalSearch/selectResults'
import type { GlobalSearchHit } from '@/lib/globalSearch/types'

export function GlobalHeaderSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spreadsheetId = useShopStore((s) => s.activeShop?.spreadsheetId ?? null)
  const { data: clients = [] } = useClients(spreadsheetId)
  const { data: jobs = [] } = useJobs(spreadsheetId)
  const { data: pieces = [] } = usePieces(spreadsheetId)
  const { data: crmNotes = [] } = useCrmNotes(spreadsheetId)
  const { data: transactions = [] } = useTransactions(spreadsheetId)
  const { data: expenses = [] } = useExpenses(spreadsheetId)
  const { data: inventory = [] } = useInventory(spreadsheetId)
  const { data: tags = [] } = useTags(spreadsheetId)
  const { data: tagLinks = [] } = useTagLinks(spreadsheetId)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const rows = useMemo(
    () =>
      buildGlobalSearchRows(
        {
          clients,
          jobs,
          pieces,
          crmNotes,
          transactions,
          expenses,
          inventory,
          tags,
          tagLinks,
        },
        t
      ),
    [
      clients,
      jobs,
      pieces,
      crmNotes,
      transactions,
      expenses,
      inventory,
      tags,
      tagLinks,
      t,
    ]
  )

  const trimmed = query.trim()
  const results = useMemo(
    () => selectGlobalSearchResults(rows, query),
    [rows, query]
  )

  const showPanel = open && trimmed.length >= 2

  useEffect(() => {
    return () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current)
      }
    }
  }, [])

  const go = (hit: GlobalSearchHit) => {
    navigate(hit.navigateTo)
    setOpen(false)
  }

  const handleBlurContainer = () => {
    blurTimeout.current = setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false)
      }
    }, 150)
  }

  const handleFocusContainer = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current)
      blurTimeout.current = null
    }
  }

  if (!spreadsheetId) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlurCapture={handleBlurContainer}
      onFocusCapture={handleFocusContainer}
    >
      <input
        id={`${listboxId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        data-testid="global-header-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setOpen(true)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            return
          }
          if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault()
            go(results[0])
          }
        }}
        placeholder={t('globalSearch.placeholder')}
        aria-label={t('globalSearch.ariaCombobox')}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {showPanel ? (
        <ul
          id={listboxId}
          data-testid="global-search-listbox"
          role="listbox"
          aria-label={t('globalSearch.listLabel')}
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li
              role="presentation"
              className="px-3 py-2 text-sm text-gray-500"
            >
              {t('globalSearch.noResults')}
            </li>
          ) : (
            results.map((hit) => (
              <li key={`${hit.kind}-${hit.id}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  data-testid={`global-search-option-${hit.kind}-${hit.id}`}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(hit)}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t(`globalSearch.kind.${hit.kind}`)}
                  </span>
                  <span className="text-gray-900">{hit.primaryLine}</span>
                  {hit.secondaryLine ? (
                    <span className="text-xs text-gray-600">{hit.secondaryLine}</span>
                  ) : null}
                  {hit.snippet ? (
                    <span className="line-clamp-2 text-xs text-gray-500">
                      {hit.snippet}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
